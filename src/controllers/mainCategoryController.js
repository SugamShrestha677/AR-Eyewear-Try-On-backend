const MainCategory = require('../models/MainCategoryModel');

const createMainCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Main category name is required'
      });
    }

    const mainCategory = new MainCategory({
      name: name.trim()
    });

    const savedMainCategory = await mainCategory.save();

    res.status(201).json({
      success: true,
      message: 'Main category created successfully',
      data: savedMainCategory
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Main category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating main category',
      error: error.message
    });
  }
};

const getAllMainCategories = async (req, res) => {
  try {
    const mainCategories = await MainCategory.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Main categories retrieved successfully',
      data: mainCategories,
      count: mainCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching main categories',
      error: error.message
    });
  }
};

const getMainCategoryById = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Main category retrieved successfully',
      data: mainCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching main category',
      error: error.message
    });
  }
};

const updateMainCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Main category name is required'
      });
    }

    const mainCategory = await MainCategory.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Main category updated successfully',
      data: mainCategory
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Main category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating main category',
      error: error.message
    });
  }
};

const deleteMainCategory = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findByIdAndDelete(req.params.id);

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Main category deleted successfully',
      data: mainCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting main category',
      error: error.message
    });
  }
};

module.exports = {
  createMainCategory,
  getAllMainCategories,
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory
};