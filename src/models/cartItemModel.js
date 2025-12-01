const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: true
    },
    frame: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Frame",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
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

// Add index for unique cart+frame combination
CartItemSchema.index({ cart: 1, frame: 1 }, { unique: true });

// Update timestamp before saving
CartItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const CartItem = mongoose.model("CartItem", CartItemSchema);
module.exports = CartItem;