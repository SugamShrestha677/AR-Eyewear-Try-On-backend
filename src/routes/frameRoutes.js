const express = require('express');
const multer = require('multer'); // Add this import at the top
const router = express.Router();
const frame = require("../controllers/frameController");

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for multiple images)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route   POST /api/frames
// @desc    Add a new frame with images stored in MongoDB
// @access  Public
router.post('/', 
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'overlayImage', maxCount: 1 }
  ]), 
  frame.addFrame
);

// @route   PUT /api/frames/:frameId
// @desc    Update a frame with optional image updates
// @access  Public
router.put('/:frameId', 
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'overlayImage', maxCount: 1 }
  ]), 
  frame.updateFrame
);

// Image routes should come before parameter routes to avoid conflicts
router.get('/images/:frameId/overlay', frame.getFrameOverlayImage);
router.get('/images/:frameId/:imageIndex', frame.getFrameImage);

// @route   DELETE /api/frames/:frameId
// @desc    Delete a frame by ID
// @access  Public
router.delete('/:frameId', frame.deleteFrame);

// @route   GET /api/frames
// @desc    Get all frames with category details
// @access  Public
router.get('/', frame.getAllFrames);

// @route   GET /api/frames/category
// @desc    Get frames filtered by main category and/or sub category
// @access  Public
// @query   mainCategoryId - Filter by main category ID
// @query   subCategoryId - Filter by sub category ID
router.get('/category', frame.getFramesByCategory);

// @route   GET /api/frames/sizes/available
// @desc    Get all available frame sizes
// @access  Public
router.get('/sizes/available', frame.getAvailableSizes);

// @route   GET /api/frames/:frameId
// @desc    Get a single frame by ID with category details
// @access  Public
router.get('/:frameId', frame.getFrameById);

module.exports = router;