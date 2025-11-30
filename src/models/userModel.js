const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "CUSTOMER",
    enum: ["ADMIN", "CUSTOMER"]
  },
  mobile: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "ACTIVE"
  },
  profilePhoto: {
    type: String,
    default: function() {
      const randomId = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
      return `https://avatar.iran.liara.run/public/${randomId}`;
    },
  },
  resetCode: {
    type: String,
  },
  resetCodeExpires: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  lastResetRequest: {
    type: Date,
  },
  resetAttempts: {
    type: Number,
    default: 0
  },
  accountSuspendedUntil: {
    type: Date,
  },
  // paymentInformation:[{
  //     type:mongoose.Schema.Types.ObjectId,
  //     ref:"payment_information"
  // }],
  // ratings:[{
  //     type:mongoose.Schema.Types.ObjectId,
  //     ref:"ratings"
  // }],
  // reviews:[{
  //     type:mongoose.Schema.Types.ObjectId,
  //     ref:"reviews"
  // }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model("users", userSchema);
module.exports = User;