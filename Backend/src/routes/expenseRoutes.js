const express = require('express');
const multer = require('multer');
const { body, query } = require('express-validator');
const { 
  submitExpense, 
  getMyExpenses, 
  getAllExpenses, 
  getPendingApprovals, 
  getTeamExpenses, 
  getExpense 
} = require('../controllers/expenseController');
const { 
  approveExpense, 
  rejectExpense 
} = require('../controllers/approvalController');
const auth = require('../middleware/auth');
const { adminOnly, managerOrAdmin, employeeOrAbove } = require('../middleware/roleCheck');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// @route   POST /api/expenses/submit
// @desc    Submit new expense
// @access  Private (Employee/Manager/Admin)
router.post('/submit', [
  auth,
  employeeOrAbove,
  upload.single('receipt'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Description must be between 3 and 200 characters'),
  body('category')
    .isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other'])
    .withMessage('Invalid category'),
  body('date')
    .isISO8601()
    .withMessage('Date must be in valid format'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('paidBy')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Payment method must be between 2 and 50 characters')
], submitExpense);

// @route   GET /api/expenses/my
// @desc    Get user's expenses
// @access  Private (Employee/Manager/Admin)
router.get('/my', [
  auth,
  employeeOrAbove,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'partially_approved']).withMessage('Invalid status'),
  query('category').optional().isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other']).withMessage('Invalid category'),
  query('startDate').optional().isISO8601().withMessage('Start date must be in valid format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in valid format')
], getMyExpenses);

// @route   GET /api/expenses/all
// @desc    Get all expenses (Admin only)
// @access  Private (Admin only)
router.get('/all', [
  auth,
  adminOnly,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'partially_approved']).withMessage('Invalid status'),
  query('category').optional().isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other']).withMessage('Invalid category'),
  query('department').optional().trim().isLength({ max: 100 }).withMessage('Department name too long'),
  query('startDate').optional().isISO8601().withMessage('Start date must be in valid format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in valid format')
], getAllExpenses);

// @route   GET /api/expenses/pending
// @desc    Get pending approvals
// @access  Private (Manager/Admin)
router.get('/pending', [
  auth,
  managerOrAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getPendingApprovals);

// @route   GET /api/expenses/team
// @desc    Get team expenses
// @access  Private (Manager/Admin)
router.get('/team', [
  auth,
  managerOrAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'partially_approved']).withMessage('Invalid status'),
  query('category').optional().isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other']).withMessage('Invalid category'),
  query('startDate').optional().isISO8601().withMessage('Start date must be in valid format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in valid format')
], getTeamExpenses);

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', [
  auth
], getExpense);

// @route   PATCH /api/expenses/:id/approve
// @desc    Approve expense
// @access  Private (Manager/Admin)
router.patch('/:id/approve', [
  auth,
  managerOrAdmin,
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
], approveExpense);

// @route   PATCH /api/expenses/:id/reject
// @desc    Reject expense
// @access  Private (Manager/Admin)
router.patch('/:id/reject', [
  auth,
  managerOrAdmin,
  body('comments')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection comments must be between 10 and 500 characters'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Rejection reason cannot exceed 200 characters')
], rejectExpense);

module.exports = router;
