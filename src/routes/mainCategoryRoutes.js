const express = require('express');
const router = express.Router();
const {
  createMainCategory,
  getAllMainCategories,
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory
} = require('../controllers/mainCategoryController');

// @route   POST /api/main-categories
// @desc    Create a new main category (e.g., "Sunglasses", "Prescription Glasses")
// @access  Public
// @body    { name: "Sunglasses" }
router.post('/', createMainCategory);

// @route   GET /api/main-categories
// @desc    Get all main categories with their IDs and names
// @access  Public
// @returns { success: boolean, data: array of categories, count: number }
router.get('/', getAllMainCategories);

// @route   GET /api/main-categories/:id
// @desc    Get a single main category by its ID
// @access  Public
// @params  id - The ID of the main category to retrieve
// @returns { success: boolean, data: category object }
router.get('/:id', getMainCategoryById);

// @route   PUT /api/main-categories/:id
// @desc    Update an existing main category name
// @access  Public
// @params  id - The ID of the main category to update
// @body    { name: "Updated Category Name" }
// @returns { success: boolean, data: updated category object }
router.put('/:id', updateMainCategory);

// @route   DELETE /api/main-categories/:id
// @desc    Delete a main category by its ID
// @access  Public
// @params  id - The ID of the main category to delete
// @returns { success: boolean, data: deleted category object }
router.delete('/:id', deleteMainCategory);

module.exports = router;