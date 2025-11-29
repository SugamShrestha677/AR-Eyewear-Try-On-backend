const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  mainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainCategory',
    required: true
  }
}, {
  timestamps: true
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
module.exports = SubCategory;