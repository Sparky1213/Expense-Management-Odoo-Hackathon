const { parseReceipt, extractText } = require('../utils/ocr');

// @desc    Parse receipt using OCR and AI
// @route   POST /api/ocr/parse
// @access  Private
const parseReceiptImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File must be an image'
      });
    }

    const result = await parseReceipt(req.file.buffer);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse receipt',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Receipt parsed successfully',
      data: result.data
    });

  } catch (error) {
    console.error('OCR parse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error parsing receipt',
      error: error.message
    });
  }
};

// @desc    Extract text from image
// @route   POST /api/ocr/extract
// @access  Private
const extractTextFromImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File must be an image'
      });
    }

    const result = await extractText(req.file.buffer);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to extract text',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Text extracted successfully',
      data: {
        text: result.text
      }
    });

  } catch (error) {
    console.error('OCR extract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extracting text',
      error: error.message
    });
  }
};

module.exports = {
  parseReceiptImage,
  extractTextFromImage
};
