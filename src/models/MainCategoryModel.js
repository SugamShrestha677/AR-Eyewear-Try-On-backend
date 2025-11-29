const mongoose = require('mongoose');

const mainCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  }
}, {
  timestamps: true
});

const MainCategory = mongoose.model('MainCategory', mainCategorySchema);
module.exports = MainCategory;