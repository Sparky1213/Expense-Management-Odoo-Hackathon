const express = require('express');
const multer = require('multer');
const { parseReceiptImage, extractTextFromImage } = require('../controllers/ocrController');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/ocr/parse
// @desc    Parse receipt using OCR and AI
// @access  Private
router.post('/parse', [
  auth,
  upload.single('image')
], parseReceiptImage);

// @route   POST /api/ocr/extract
// @desc    Extract text from image
// @access  Private
router.post('/extract', [
  auth,
  upload.single('image')
], extractTextFromImage);

module.exports = router;
