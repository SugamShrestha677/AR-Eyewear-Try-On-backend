const SubCategory = require('../models/SubCategoryModel');
const MainCategory = require('../models/MainCategoryModel');

const createSubCategory = async (req, res) => {
  try {
    const { name, mainCategory } = req.body;

    if (!name || !mainCategory) {
      return res.status(400).json({
        success: false,
        message: 'Sub category name and main category are required'
      });
    }

    // Check if main category exists
    const mainCategoryExists = await MainCategory.findById(mainCategory);
    if (!mainCategoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    const subCategory = new SubCategory({
      name: name.trim(),
      mainCategory: mainCategory
    });

    const savedSubCategory = await subCategory.save();

    res.status(201).json({
      success: true,
      message: 'Sub category created successfully',
      data: savedSubCategory
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sub category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating sub category',
      error: error.message
    });
  }
};

const getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find()
      .populate('mainCategory', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Sub categories retrieved successfully',
      data: subCategories,
      count: subCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub categories',
      error: error.message
    });
  }
};

const getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('mainCategory', 'name');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub category retrieved successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub category',
      error: error.message
    });
  }
};

const getSubCategoriesByMainCategory = async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    
    const subCategories = await SubCategory.find({ mainCategory: mainCategoryId })
      .populate('mainCategory', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Sub categories retrieved successfully',
      data: subCategories,
      count: subCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub categories',
      error: error.message
    });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const { name, mainCategory } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Sub category name is required'
      });
    }

    const updateData = { name: name.trim() };
    
    if (mainCategory) {
      // Check if main category exists
      const mainCategoryExists = await MainCategory.findById(mainCategory);
      if (!mainCategoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Main category not found'
        });
      }
      updateData.mainCategory = mainCategory;
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('mainCategory', 'name');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub category updated successfully',
      data: subCategory
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sub category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating sub category',
      error: error.message
    });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub category deleted successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sub category',
      error: error.message
    });
  }
};

module.exports = {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoriesByMainCategory,
  updateSubCategory,
  deleteSubCategory
};