const mongoose = require('mongoose');
const Frame = require('./frameModel');

const CartItemSchema = new mongoose.Schema({
    cart:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Cart",
        required:true
    },
    frame:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Frame",
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        min:1
    },
    price:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        default: Date.now()
    }
});

const CartItem = mongoose.model("CartItem", CartItemSchema);
module.exports = CartItem