const express = require('express');
const { body, query } = require('express-validator');
const { 
  getUsers, 
  getUser, 
  addUser, 
  updateUser, 
  deleteUser, 
  getTeamMembers,
  sendInvitation,
  acceptInvitation
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { adminOnly, managerOrAdmin, employeeOrAbove } = require('../middleware/roleCheck');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users in company
// @access  Private (Admin/Manager)
router.get('/', [
  auth,
  managerOrAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long')
], getUsers);

// @route   GET /api/users/team
// @desc    Get team members
// @access  Private (Manager/Admin)
router.get('/team', [
  auth,
  managerOrAdmin
], getTeamMembers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin/Manager)
router.get('/:id', [
  auth,
  managerOrAdmin
], getUser);

// @route   POST /api/users
// @desc    Add new user
// @access  Private (Admin only)
router.post('/', [
  auth,
  adminOnly,
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('sendInvitation')
    .optional()
    .isBoolean()
    .withMessage('sendInvitation must be a boolean'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('manager')
    .optional()
    .isMongoId()
    .withMessage('Invalid manager ID')
], addUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  adminOnly,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('manager')
    .optional()
    .isMongoId()
    .withMessage('Invalid manager ID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', [
  auth,
  adminOnly
], deleteUser);

// @route   POST /api/users/:id/send-invitation
// @desc    Send invitation to existing user
// @access  Private (Admin only)
router.post('/:id/send-invitation', [
  auth,
  adminOnly
], sendInvitation);

// @route   POST /api/users/accept-invitation
// @desc    Accept invitation and set password
// @access  Public
router.post('/accept-invitation', [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], acceptInvitation);

module.exports = router;
