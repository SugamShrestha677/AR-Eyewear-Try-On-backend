const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
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
  },
  profilePhoto: {
    type: String,
    default:
      "https://res.cloudinary.com/yourapp/image/upload/v1/default-profile.png",
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
    default: Date.now(),
  },
});

const User = mongoose.model("users", userSchema);
module.exports = User;
