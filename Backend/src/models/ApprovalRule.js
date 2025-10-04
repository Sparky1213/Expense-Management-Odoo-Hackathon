const mongoose = require('mongoose');

const approvalRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Rule name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  approvers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  sequenceType: {
    type: String,
    enum: ['sequential', 'parallel', 'percentage', 'any_one'],
    default: 'sequential'
  },
  minApprovalPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  conditions: {
    minAmount: {
      type: Number,
      default: 0
    },
    maxAmount: {
      type: Number,
      default: Infinity
    },
    categories: [{
      type: String,
      enum: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other']
    }],
    departments: [{
      type: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
approvalRuleSchema.index({ company: 1, isActive: 1 });
approvalRuleSchema.index({ priority: -1 });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
