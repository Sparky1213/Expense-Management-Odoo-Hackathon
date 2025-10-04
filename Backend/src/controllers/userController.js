const { validationResult } = require('express-validator');
const User = require('../models/User');
const Company = require('../models/Company');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// @desc    Get all users in company
// @route   GET /api/users
// @access  Private (Admin/Manager)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const companyId = req.user.company._id;

    // Build query
    let query = { company: companyId };
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Manager)
const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const companyId = req.user.company._id;

    const user = await User.findOne({ 
      _id: userId, 
      company: companyId 
    })
    .select('-password')
    .populate('manager', 'name email')
    .populate('company');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: error.message
    });
  }
};

// @desc    Add new user
// @route   POST /api/users
// @access  Private (Admin only)
const addUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, department, manager, sendInvitation } = req.body;
    const companyId = req.user.company._id;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({ 
        _id: manager, 
        company: companyId,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager selected'
        });
      }
    }

    // Generate invitation token if sending invitation
    const invitationToken = sendInvitation ? crypto.randomBytes(32).toString('hex') : null;
    const invitationExpires = sendInvitation ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null; // 7 days

    const user = new User({
      name,
      email,
      password: sendInvitation ? undefined : password, // Don't set password if sending invitation
      role: role || 'employee',
      company: companyId,
      manager: manager || null,
      department: department || '',
      invitationToken: invitationToken,
      invitationExpires: invitationExpires,
      isActive: !sendInvitation // Set as inactive if sending invitation
    });

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('manager', 'name email')
      .populate('company');

    // Send invitation email if requested
    if (sendInvitation && invitationToken) {
      try {
        const company = await Company.findById(companyId);
        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;
        
        const emailResult = await emailService.sendInvitationEmail({
          email, // Corrected key
          name,
          companyName: company.name,
          invitationLink: invitationLink,
          role: role || 'employee'
        });

        if (emailResult.success) {
          console.log(`Invitation email sent to ${email}`);
        } else {
          console.error(`Failed to send invitation email to ${email}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the user creation if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: sendInvitation ? 'User created and invitation sent successfully' : 'User created successfully',
      data: { user: populatedUser }
    });

  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.params.id;
    const companyId = req.user.company._id;
    const { name, email, role, department, manager, isActive } = req.body;

    // Check if user exists in company
    const existingUser = await User.findOne({ 
      _id: userId, 
      company: companyId 
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id && role && role !== existingUser.role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Validate manager if provided
    if (manager) {
      const managerUser = await User.findOne({ 
        _id: manager, 
        company: companyId,
        role: { $in: ['admin', 'manager'] }
      });
      
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager selected'
        });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken by another user'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (manager !== undefined) updateData.manager = manager;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('manager', 'name email')
    .populate('company');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const companyId = req.user.company._id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findOne({ 
      _id: userId, 
      company: companyId 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: error.message
    });
  }
};

// @desc    Send invitation to existing user
// @route   POST /api/users/:id/send-invitation
// @access  Private (Admin only)
const sendInvitation = async (req, res) => {
  try {
    const userId = req.params.id;
    const companyId = req.user.company._id;

    // Find user in company
    const user = await User.findOne({ 
      _id: userId, 
      company: companyId 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with invitation details
    user.invitationToken = invitationToken;
    user.invitationExpires = invitationExpires;
    user.isActive = false; // Set as inactive until they accept invitation
    await user.save();

    // Send invitation email
    try {
      const company = await Company.findById(companyId);
      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${invitationToken}`;
      
      const emailResult = await emailService.sendInvitationEmail({
        email: user.email,
        name: user.name,
        companyName: company.name,
        invitationLink: invitationLink,
        role: user.role
      });

      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Invitation sent successfully',
          data: { messageId: emailResult.messageId }
        });
      } else {
        console.error('Failed to send invitation email:', emailResult.error);
        res.status(500).json({
          success: false,
          message: 'Failed to send invitation email',
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Error sending invitation email',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending invitation',
      error: error.message
    });
  }
};

// @desc    Accept invitation and set password
// @route   POST /api/users/accept-invitation
// @access  Public
const acceptInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Find user with valid invitation token
    const user = await User.findOne({
      invitationToken: token,
      invitationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }

    // Update user with password and activate
    user.password = password;
    user.invitationToken = undefined;
    user.invitationExpires = undefined;
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'Invitation accepted successfully. You can now log in.'
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting invitation',
      error: error.message
    });
  }
};

// @desc    Get team members (for managers)
// @route   GET /api/users/team
// @access  Private (Manager/Admin)
const getTeamMembers = async (req, res) => {
  try {
    const companyId = req.user.company._id;
    const currentUserId = req.user.id;

    let query = { company: companyId, isActive: true };
    
    // If user is manager, only show their team members
    if (req.user.role === 'manager') {
      query.manager = currentUserId;
    }

    const teamMembers = await User.find(query)
      .select('-password')
      .populate('manager', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { teamMembers }
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching team members',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  getTeamMembers,
  sendInvitation,
  acceptInvitation
};
