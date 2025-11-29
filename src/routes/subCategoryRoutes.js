const express = require('express');
const router = express.Router();
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoriesByMainCategory,
  updateSubCategory,
  deleteSubCategory
} = require('../controllers/subCategoryController');

// @route   POST /api/sub-categories
// @desc    Create a new sub category under a main category (e.g., "Men Sunglasses" under "Sunglasses")
// @access  Public
// @body    { name: "Men Sunglasses", mainCategory: "main_category_id_here" }
// @returns { success: boolean, data: created sub category with main category details }
router.post('/', createSubCategory);

// @route   GET /api/sub-categories
// @desc    Get all sub categories with their main category information
// @access  Public
// @returns { success: boolean, data: array of sub categories, count: number }
// @note    Each sub category includes main category name and ID for easy reference
router.get('/', getAllSubCategories);

// @route   GET /api/sub-categories/:id
// @desc    Get a single sub category by its ID with main category details
// @access  Public
// @params  id - The ID of the sub category to retrieve
// @returns { success: boolean, data: sub category object with main category info }
router.get('/:id', getSubCategoryById);

// @route   GET /api/sub-categories/main-category/:mainCategoryId
// @desc    Get all sub categories that belong to a specific main category
// @access  Public
// @params  mainCategoryId - The ID of the main category to filter sub categories
// @returns { success: boolean, data: array of sub categories, count: number }
// @example Useful for dropdowns when user selects a main category
router.get('/main-category/:mainCategoryId', getSubCategoriesByMainCategory);

// @route   PUT /api/sub-categories/:id
// @desc    Update a sub category (name and/or change its main category)
// @access  Public
// @params  id - The ID of the sub category to update
// @body    { name: "Updated Name", mainCategory: "new_main_category_id" }
// @returns { success: boolean, data: updated sub category object }
router.put('/:id', updateSubCategory);

// @route   DELETE /api/sub-categories/:id
// @desc    Delete a sub category by its ID
// @access  Public
// @params  id - The ID of the sub category to delete
// @returns { success: boolean, data: deleted sub category object }
router.delete('/:id', deleteSubCategory);

module.exports = router;