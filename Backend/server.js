const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const approvalRoutes = require('./src/routes/approvalRoutes');
const ocrRoutes = require('./src/routes/ocrRoutes');

const app = express();

// Disable ETag to avoid conditional GET 304 responses for API endpoints
app.disable('etag');

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Parse JSON bodies (required for application/json requests from the frontend)
app.use(express.json({ limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/ocr', ocrRoutes);

// Currency API routes
app.get('/api/currency/supported', async (req, res) => {
  try {
    const { getSupportedCurrencies } = require('./src/utils/currency');
    const currencies = await getSupportedCurrencies();
    res.json({
      success: true,
      data: { currencies }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported currencies',
      error: error.message
    });
  }
});

app.get('/api/currency/countries', async (req, res) => {
  try {
    const { getCountriesAndCurrencies } = require('./src/utils/currency');
    const countries = await getCountriesAndCurrencies();
    res.json({
      success: true,
      data: { countries }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries and currencies',
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected field in file upload.'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
