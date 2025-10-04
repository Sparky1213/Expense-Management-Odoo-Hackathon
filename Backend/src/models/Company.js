const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  baseCurrency: {
    type: String,
    required: [true, 'Base currency is required'],
    uppercase: true,
    length: [3, 'Currency code must be 3 characters']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    allowMultiCurrency: {
      type: Boolean,
      default: true
    },
    requireReceipt: {
      type: Boolean,
      default: true
    },
    maxExpenseAmount: {
      type: Number,
      default: 10000
    },
    autoApprovalLimit: {
      type: Number,
      default: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
