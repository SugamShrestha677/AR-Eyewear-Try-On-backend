const mongoose = require('mongoose');
const frameSchema = new mongoose.Schema({
 name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["full_rim", "half_rim", "rimless"],
    required: true
  },
  shape: {
    type: String,
    enum: ["round", "rectangle", "square", "aviator", "wayfarer"],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: "",
    required:true
  },
  picture: {
    type: String,
    default: "",
    required:true
  },
  description: {
    type: String,
    default: ""
  },
  colors: [{
    type: String
  }],
  size: {
    type: String
  },
  dimensions: {
    width: Number,
    height: Number,
    bridge: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Frame = mongoose.model("Frame", frameSchema);
module.exports = Frame;