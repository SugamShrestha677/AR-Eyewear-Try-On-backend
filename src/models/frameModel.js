const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  mainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainCategory',
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: true
  },
  type: {
    type: String,
    enum: ["full_rim", "half_rim", "rimless"],
    required: true
  },
  shape: {
    type: String,
    enum: ["round", "rectangle", "square", "aviator", "wayfarer", "cate_eye", "geometric", "oval", "browline"],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    data: Buffer, // Store image binary data
    contentType: String, // e.g., 'image/jpeg', 'image/png'
    filename: String, // Original file name
    size: Number, // File size in bytes
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  overlayImage: {
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  description: {
    type: String,
    default: ""
  },
  colors: [{
    type: String,
    required: true
  }],
  size: {
    type: String,
    enum: ["extra-small", "small", "medium", "large", "extra-large"],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
frameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Frame = mongoose.model("Frame", frameSchema);
module.exports = Frame;