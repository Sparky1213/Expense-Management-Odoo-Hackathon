const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Office Supplies', 'Travel', 'Other'],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  originalAmount: {
    type: Number,
    required: true
  },
  originalCurrency: {
    type: String,
    required: true,
    uppercase: true,
    length: [3, 'Currency code must be 3 characters']
  },
  baseAmount: {
    type: Number,
    required: true
  },
  baseCurrency: {
    type: String,
    required: true,
    uppercase: true,
    length: [3, 'Currency code must be 3 characters']
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  paidBy: {
    type: String,
    required: [true, 'Payment method is required'],
    trim: true,
    maxlength: [50, 'Payment method cannot be more than 50 characters']
  },
  receipt: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    },
    ocrData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'partially_approved'],
    default: 'pending'
  },
  approvalWorkflow: {
    currentStep: {
      type: Number,
      default: 0
    },
    totalSteps: {
      type: Number,
      default: 0
    },
    approvers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      comments: {
        type: String,
        default: ''
      },
      approvedAt: {
        type: Date,
        default: null
      }
    }],
    completedAt: {
      type: Date,
      default: null
    }
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ submittedBy: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
