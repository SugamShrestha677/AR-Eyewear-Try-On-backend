const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "users",
    unique: true, // One cart per user
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartItem",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
