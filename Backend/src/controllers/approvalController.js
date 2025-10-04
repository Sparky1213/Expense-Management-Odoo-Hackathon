const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const User = require('../models/User');

// @desc    Approve expense
// @route   PATCH /api/expenses/:id/approve
// @access  Private (Manager/Admin)
const approveExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const expenseId = req.params.id;
    const { comments = '' } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company._id;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: companyId,
      status: 'pending'
    }).populate('approvalWorkflow.approvers.user', 'name email role');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or not pending approval'
      });
    }

    // Allow admin to override approval workflow
    if (req.user.role === 'admin') {
      expense.status = 'approved';
      expense.approvedBy = userId;
      expense.approvedAt = new Date();
      expense.approvalWorkflow.completedAt = new Date();
      
      // Mark all approvers as approved
      expense.approvalWorkflow.approvers.forEach(approver => {
        if (approver.status === 'pending') {
          approver.status = 'approved';
          approver.comments = 'Admin override approval';
          approver.approvedAt = new Date();
        }
      });
      
      await expense.save();
      
      const updatedExpense = await Expense.findById(expense._id)
        .populate('submittedBy', 'name email')
        .populate('approvalWorkflow.approvers.user', 'name email role')
        .populate('approvedBy', 'name email');

      return res.json({
        success: true,
        message: 'Expense approved successfully by admin override',
        data: { expense: updatedExpense }
      });
    }

    // For managers, check if they are an approver
    const approverIndex = expense.approvalWorkflow.approvers.findIndex(
      approver => approver.user._id.toString() === userId && approver.status === 'pending'
    );

    if (approverIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this expense'
      });
    }

    // Update approver status
    expense.approvalWorkflow.approvers[approverIndex].status = 'approved';
    expense.approvalWorkflow.approvers[approverIndex].comments = comments;
    expense.approvalWorkflow.approvers[approverIndex].approvedAt = new Date();

    // Check if approval workflow is complete
    const isComplete = await checkApprovalCompletion(expense);
    
    if (isComplete) {
      expense.status = 'approved';
      expense.approvalWorkflow.completedAt = new Date();
      expense.approvedBy = userId;
      expense.approvedAt = new Date();
    }

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvalWorkflow.approvers.user', 'name email role')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: { expense: updatedExpense }
    });

  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving expense',
      error: error.message
    });
  }
};

// @desc    Reject expense
// @route   PATCH /api/expenses/:id/reject
// @access  Private (Manager/Admin)
const rejectExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const expenseId = req.params.id;
    const { comments, reason } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company._id;

    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection comments are required'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      company: companyId,
      status: 'pending'
    }).populate('approvalWorkflow.approvers.user', 'name email role');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or not pending approval'
      });
    }

    // Check if current user is an approver
    const approverIndex = expense.approvalWorkflow.approvers.findIndex(
      approver => approver.user._id.toString() === userId && approver.status === 'pending'
    );

    if (approverIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this expense'
      });
    }

    // Update approver status
    expense.approvalWorkflow.approvers[approverIndex].status = 'rejected';
    expense.approvalWorkflow.approvers[approverIndex].comments = comments;
    expense.approvalWorkflow.approvers[approverIndex].approvedAt = new Date();

    // Reject the entire expense
    expense.status = 'rejected';
    expense.rejectionReason = reason || comments;
    expense.approvalWorkflow.completedAt = new Date();

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('approvalWorkflow.approvers.user', 'name email role');

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      data: { expense: updatedExpense }
    });

  } catch (error) {
    console.error('Reject expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting expense',
      error: error.message
    });
  }
};

// @desc    Create approval rule
// @route   POST /api/approvals/rules
// @access  Private (Admin only)
const createApprovalRule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      approvers,
      sequenceType,
      minApprovalPercentage,
      conditions
    } = req.body;

    const companyId = req.user.company._id;

    // Validate approvers
    const approverIds = approvers.map(a => a.user);
    const validApprovers = await User.find({
      _id: { $in: approverIds },
      company: companyId,
      role: { $in: ['admin', 'manager'] }
    });

    if (validApprovers.length !== approverIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more approvers are invalid'
      });
    }

    // Sort approvers by order
    const sortedApprovers = approvers.sort((a, b) => a.order - b.order);

    const rule = new ApprovalRule({
      name,
      description,
      company: companyId,
      approvers: sortedApprovers,
      sequenceType: sequenceType || 'sequential',
      minApprovalPercentage: minApprovalPercentage || 100,
      conditions: conditions || {}
    });

    await rule.save();

    const populatedRule = await ApprovalRule.findById(rule._id)
      .populate('approvers.user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Approval rule created successfully',
      data: { rule: populatedRule }
    });

  } catch (error) {
    console.error('Create approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating approval rule',
      error: error.message
    });
  }
};

// @desc    Get approval rules
// @route   GET /api/approvals/rules
// @access  Private (Admin only)
const getApprovalRules = async (req, res) => {
  try {
    const companyId = req.user.company._id;

    const rules = await ApprovalRule.find({ company: companyId })
      .populate('approvers.user', 'name email role')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { rules }
    });

  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching approval rules',
      error: error.message
    });
  }
};

// @desc    Get single approval rule
// @route   GET /api/approvals/rules/:id
// @access  Private (Admin only)
const getApprovalRule = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const companyId = req.user.company._id;

    const rule = await ApprovalRule.findOne({ _id: ruleId, company: companyId }).populate('approvers.user', 'name email role');

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Approval rule not found' });
    }

    res.json({ success: true, data: { rule } });
  } catch (error) {
    console.error('Get approval rule error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching approval rule', error: error.message });
  }
};

// @desc    Get applicable approval rule for an expense
// @route   GET /api/approvals/rules/applicable?expenseId=...
// @access  Private (Manager/Admin)
const getApplicableRule = async (req, res) => {
  try {
    const { expenseId } = req.query;
    const companyId = req.user.company._id;

    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'expenseId query parameter is required' });
    }

    // Load expense to evaluate conditions
    const expense = await Expense.findOne({ _id: expenseId, company: companyId });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const rules = await ApprovalRule.find({ company: companyId, isActive: true }).populate('approvers.user', 'name email role');

    let matched = null;
    for (const rule of rules) {
      const cond = rule.conditions || {};
      const min = cond.minAmount != null ? Number(cond.minAmount) : 0;
      const max = cond.maxAmount != null && isFinite(Number(cond.maxAmount)) ? Number(cond.maxAmount) : Infinity;

      // use expense.baseAmount when available, otherwise amount
      const amt = typeof expense.baseAmount === 'number' ? expense.baseAmount : expense.amount;

      if (amt < min || amt > max) continue;
      if (Array.isArray(cond.categories) && cond.categories.length > 0 && !cond.categories.includes(expense.category)) continue;
      // department checks omitted for brevity
      matched = rule;
      break;
    }

    res.json({ success: true, data: { rule: matched } });
  } catch (error) {
    console.error('Get applicable rule error:', error);
    res.status(500).json({ success: false, message: 'Server error computing applicable rule', error: error.message });
  }
};

// @desc    Update approval rule
// @route   PUT /api/approvals/rules/:id
// @access  Private (Admin only)
const updateApprovalRule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const ruleId = req.params.id;
    const companyId = req.user.company._id;
    const updateData = req.body;

    // If approvers are being updated, validate them
    if (updateData.approvers) {
      const approverIds = updateData.approvers.map(a => a.user);
      const validApprovers = await User.find({
        _id: { $in: approverIds },
        company: companyId,
        role: { $in: ['admin', 'manager'] }
      });

      if (validApprovers.length !== approverIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more approvers are invalid'
        });
      }

      // Sort approvers by order
      updateData.approvers = updateData.approvers.sort((a, b) => a.order - b.order);
    }

    const rule = await ApprovalRule.findOneAndUpdate(
      { _id: ruleId, company: companyId },
      updateData,
      { new: true, runValidators: true }
    ).populate('approvers.user', 'name email role');

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Approval rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Approval rule updated successfully',
      data: { rule }
    });

  } catch (error) {
    console.error('Update approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating approval rule',
      error: error.message
    });
  }
};

// @desc    Delete approval rule
// @route   DELETE /api/approvals/rules/:id
// @access  Private (Admin only)
const deleteApprovalRule = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const companyId = req.user.company._id;

    const rule = await ApprovalRule.findOneAndDelete({
      _id: ruleId,
      company: companyId
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Approval rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Approval rule deleted successfully'
    });

  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting approval rule',
      error: error.message
    });
  }
};

// Helper function to check if approval workflow is complete
const checkApprovalCompletion = async (expense) => {
  const { sequenceType, minApprovalPercentage, approvers } = expense.approvalWorkflow;
  
  switch (sequenceType) {
    case 'sequential':
      // Check if current step is approved and move to next
      const currentStep = expense.approvalWorkflow.currentStep;
      if (approvers[currentStep] && approvers[currentStep].status === 'approved') {
        expense.approvalWorkflow.currentStep = currentStep + 1;
        return currentStep + 1 >= approvers.length;
      }
      return false;

    case 'parallel':
      // Check if all approvers have responded
      const allResponded = approvers.every(approver => 
        approver.status === 'approved' || approver.status === 'rejected'
      );
      if (allResponded) {
        // Check if any rejection
        const hasRejection = approvers.some(approver => approver.status === 'rejected');
        if (hasRejection) {
          expense.status = 'rejected';
          return true;
        }
        // All approved
        return true;
      }
      return false;

    case 'percentage':
      // Check if approval percentage is met
      const approvedCount = approvers.filter(approver => approver.status === 'approved').length;
      const totalCount = approvers.length;
      const approvalPercentage = (approvedCount / totalCount) * 100;
      return approvalPercentage >= minApprovalPercentage;

    case 'any_one':
      // Check if any one approver has approved
      return approvers.some(approver => approver.status === 'approved');

    default:
      return false;
  }
};

module.exports = {
  approveExpense,
  rejectExpense,
  createApprovalRule,
  getApprovalRules,
  getApprovalRule,
  getApplicableRule,
  updateApprovalRule,
  deleteApprovalRule
};
