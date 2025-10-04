const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const User = require('../models/User');
const ApprovalRule = require('../models/ApprovalRule');
const { convertCurrency, isValidCurrency } = require('../utils/currency');
const { parseReceipt } = require('../utils/ocr');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Submit new expense
// @route   POST /api/expenses/submit
// @access  Private (Employee/Manager/Admin)
const submitExpense = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // FormData fields are in req.body as strings
    const { description, category, date, paidBy, amount, currency } = req.body;

    const companyId = req.user.company._id;
    const baseCurrency = req.user.company.baseCurrency;

    // Validate currency
    if (!isValidCurrency(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency code'
      });
    }

    // Convert currency
    const conversion = await convertCurrency(
      parseFloat(amount),
      currency.toUpperCase(),
      baseCurrency
    );

    // Handle file upload
    let receiptData = {};
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload_stream(
          { folder: 'expense-receipts', resource_type: 'auto' },
          async (error, uploaded) => {
            if (error) throw error;
            receiptData = {
              url: uploaded.secure_url,
              publicId: uploaded.public_id
            };

            // OCR for images
            if (req.file.mimetype.startsWith('image/')) {
              const ocrResult = await parseReceipt(req.file.buffer);
              if (ocrResult.success) {
                receiptData.ocrData = ocrResult.data;
              }
            }
          }
        );

        // Upload buffer to Cloudinary
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'expense-receipts', resource_type: 'auto' },
          (err, uploaded) => {
            if (err) throw err;
            receiptData = {
              url: uploaded.secure_url,
              publicId: uploaded.public_id
            };
          }
        );
        stream.end(req.file.buffer);

      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload receipt'
        });
      }
    }

    // Create expense
    const expense = new Expense({
      description,
      category,
      amount: conversion.convertedAmount,
      originalAmount: conversion.originalAmount,
      originalCurrency: conversion.originalCurrency,
      baseAmount: conversion.convertedAmount,
      baseCurrency: conversion.convertedCurrency,
      exchangeRate: conversion.exchangeRate,
      date: new Date(date),
      paidBy,
      receipt: receiptData,
      submittedBy: req.user.id,
      company: companyId
    });

    // Apply approval rules: find company rules and pick the first that matches conditions
    try {
      const rules = await ApprovalRule.find({ company: companyId, isActive: true }).populate('approvers.user', 'name email role')
      let matchedRule = null
      for (const rule of rules) {
        const cond = rule.conditions || {}
        const min = cond.minAmount != null ? Number(cond.minAmount) : 0
        const max = cond.maxAmount != null && isFinite(Number(cond.maxAmount)) ? Number(cond.maxAmount) : Infinity
        // Check amount condition
        if (conversion.convertedAmount < min || conversion.convertedAmount > max) continue
        // Check category condition if present
        if (Array.isArray(cond.categories) && cond.categories.length > 0 && !cond.categories.includes(category)) continue
        // Departments condition could be used here (omitted for brevity)
        matchedRule = rule
        break
      }

      if (matchedRule) {
        // Build approvers workflow from rule approvers array
        expense.approvalWorkflow.totalSteps = matchedRule.approvers.length
        expense.approvalWorkflow.currentStep = 0
        expense.approvalWorkflow.approvers = matchedRule.approvers.map((a) => ({
          user: a.user._id || a.user,
          status: 'pending',
          comments: '',
          approvedAt: null
        }))
      } else {
        // Fallback: if submitter has a manager, set them as the sole approver
        const submitter = await User.findById(req.user.id).select('manager')
        if (submitter && submitter.manager) {
          expense.approvalWorkflow.totalSteps = 1
          expense.approvalWorkflow.currentStep = 0
          expense.approvalWorkflow.approvers = [{ user: submitter.manager, status: 'pending', comments: '', approvedAt: null }]
        }
      }
    } catch (ruleErr) {
      console.error('Error applying approval rules:', ruleErr)
      // Continue without approval workflow if rule processing fails
    }

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully',
      data: { expense }
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting expense',
      error: error.message
    });
  }
};

// @desc    Get user's expenses
// @route   GET /api/expenses/my
// @access  Private (Employee/Manager/Admin)
const getMyExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, startDate, endDate } = req.query;
    const userId = req.user.id;

    // Prevent clients/proxies from returning cached 304 responses for API data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    // Ensure express conditional GET handling doesn't return 304 by clearing ETag
    res.set('ETag', '')

    // Build query
    let query = { submittedBy: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email')
      .populate('approvalWorkflow.approvers.user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expenses',
      error: error.message
    });
  }
};

// @desc    Get all expenses (Admin only)
// @route   GET /api/expenses/all
// @access  Private (Admin only)
const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, department, startDate, endDate } = req.query;
    const companyId = req.user.company._id;

    // Prevent caching for API list endpoints
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('ETag', '')

    // Build query
    let query = { company: companyId };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // If department filter is provided, find users in that department
    if (department) {
      const usersInDept = await User.find({ 
        company: companyId, 
        department: { $regex: department, $options: 'i' } 
      }).select('_id');
      
      query.submittedBy = { $in: usersInDept.map(u => u._id) };
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email department')
      .populate('approvalWorkflow.approvers.user', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expenses',
      error: error.message
    });
  }
};

// @desc    Get pending approvals
// @route   GET /api/expenses/pending
// @access  Private (Manager/Admin)
const getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Prevent caching so managers always receive fresh pending approvals
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('ETag', '')

    // Find expenses where current user is an approver
    const expenses = await Expense.find({
      status: 'pending',
      'approvalWorkflow.approvers.user': userId,
      'approvalWorkflow.approvers.status': 'pending'
    })
    .populate('submittedBy', 'name email department')
    .populate('approvalWorkflow.approvers.user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Expense.countDocuments({
      status: 'pending',
      'approvalWorkflow.approvers.user': userId,
      'approvalWorkflow.approvers.status': 'pending'
    });

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending approvals',
      error: error.message
    });
  }
};

// @desc    Get team expenses
// @route   GET /api/expenses/team
// @access  Private (Manager/Admin)
const getTeamExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, startDate, endDate } = req.query;
    const companyId = req.user.company._id;
    const currentUserId = req.user.id;

    // Prevent caching for team lists
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('ETag', '')

    // Find team members
    let teamMemberIds = [];
    
    if (req.user.role === 'admin') {
      // Admin can see all expenses in company
      teamMemberIds = await User.find({ company: companyId }).select('_id');
    } else if (req.user.role === 'manager') {
      // Manager can see their team members' expenses
      teamMemberIds = await User.find({ 
        company: companyId, 
        manager: currentUserId 
      }).select('_id');
    }

    teamMemberIds = teamMemberIds.map(u => u._id);

    // Build query
    let query = { 
      submittedBy: { $in: teamMemberIds },
      company: companyId
    };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email department')
      .populate('approvalWorkflow.approvers.user', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get team expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching team expenses',
      error: error.message
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;
    const companyId = req.user.company._id;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: companyId
    })
    .populate('submittedBy', 'name email department')
    .populate('approvalWorkflow.approvers.user', 'name email role')
    .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has access to this expense
    const hasAccess = 
      expense.submittedBy._id.toString() === userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'manager' && expense.submittedBy.manager && 
       expense.submittedBy.manager.toString() === userId) ||
      expense.approvalWorkflow.approvers.some(approver => 
        approver.user._id.toString() === userId
      );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this expense'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching expense',
      error: error.message
    });
  }
};

module.exports = {
  submitExpense,
  getMyExpenses,
  getAllExpenses,
  getPendingApprovals,
  getTeamExpenses,
  getExpense
};
