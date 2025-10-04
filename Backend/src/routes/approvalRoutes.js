const express = require('express');
const { body } = require('express-validator');
const approvalController = require('../controllers/approvalController');
const auth = require('../middleware/auth');
const { adminOnly, managerOrAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// @route   POST /api/approvals/rules
// @desc    Create approval rule
// @access  Private (Admin only)
router.post('/rules', [
  auth,
  adminOnly,
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Rule name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('approvers')
    .isArray({ min: 1 })
    .withMessage('At least one approver is required'),
  body('approvers.*.user')
    .isMongoId()
    .withMessage('Invalid approver user ID'),
  body('approvers.*.order')
    .isInt({ min: 1 })
    .withMessage('Approver order must be a positive integer'),
  body('sequenceType')
    .optional()
    .isIn(['sequential', 'parallel', 'percentage', 'any_one'])
    .withMessage('Invalid sequence type'),
  body('minApprovalPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Approval percentage must be between 0 and 100'),
  body('conditions.minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  body('conditions.maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  body('conditions.categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('conditions.categories.*')
    .optional()
    .isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other'])
    .withMessage('Invalid category'),
  body('conditions.departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
], approvalController.createApprovalRule);

// @route   GET /api/approvals/rules
// @desc    Get approval rules
// @access  Private (Admin only)
router.get('/rules', [
  auth,
  adminOnly
], approvalController.getApprovalRules);

// @route   GET /api/approvals/rules/applicable
// @desc    Get applicable approval rule for an expense
// @access  Private (Manager/Admin)
router.get('/rules/applicable', [
  auth,
  managerOrAdmin
], approvalController.getApplicableRule);

// @route   GET /api/approvals/rules/:id
// @desc    Get single approval rule
// @access  Private (Admin only)
router.get('/rules/:id', [
  auth,
  adminOnly
], approvalController.getApprovalRule);

// @route   PUT /api/approvals/rules/:id
// @desc    Update approval rule
// @access  Private (Admin only)
router.put('/rules/:id', [
  auth,
  adminOnly,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Rule name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('approvers')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one approver is required'),
  body('approvers.*.user')
    .optional()
    .isMongoId()
    .withMessage('Invalid approver user ID'),
  body('approvers.*.order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Approver order must be a positive integer'),
  body('sequenceType')
    .optional()
    .isIn(['sequential', 'parallel', 'percentage', 'any_one'])
    .withMessage('Invalid sequence type'),
  body('minApprovalPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Approval percentage must be between 0 and 100'),
  body('conditions.minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  body('conditions.maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),
  body('conditions.categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('conditions.categories.*')
    .optional()
    .isIn(['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other'])
    .withMessage('Invalid category'),
  body('conditions.departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], approvalController.updateApprovalRule);

// @route   DELETE /api/approvals/rules/:id
// @desc    Delete approval rule
// @access  Private (Admin only)
router.delete('/rules/:id', [
  auth,
  adminOnly
], approvalController.deleteApprovalRule);

module.exports = router;
