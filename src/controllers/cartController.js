// cartController.js - With clean responses
const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const CartItem = require('../models/cartItemModel');
const Frame = require('../models/frameModel');

// Helper function to update cart totals
const updateCartTotals = async (cartId) => {
    try {
        const result = await CartItem.aggregate([
            {
                $match: { cart: new mongoose.Types.ObjectId(cartId) }
            },
            {
                $group: {
                    _id: "$cart",
                    totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } },
                    totalItems: { $sum: "$quantity" }
                }
            }
        ]);

        const totals = result[0] || { totalPrice: 0, totalItems: 0 };
        
        await Cart.findByIdAndUpdate(cartId, {
            totalPrice: totals.totalPrice,
            updatedAt: Date.now()
        });

        return totals;
    } catch (error) {
        console.error("Error updating cart totals:", error);
        throw error;
    }
};

// Helper function to format cart item response
const formatCartItem = (cartItem) => {
    const formattedItem = cartItem.toObject ? cartItem.toObject() : cartItem;
    
    // Clean up the frame object to only include _id, name, and price
    if (formattedItem.frame && typeof formattedItem.frame === 'object') {
        formattedItem.frame = {
            _id: formattedItem.frame._id,
            name: formattedItem.frame.name,
            price: formattedItem.frame.price
        };
    }
    
    return formattedItem;
};

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.userId;
        
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = await Cart.create({ user: userId });
        }
        
        const cartItems = await CartItem.find({ cart: cart._id })
            .populate({
                path: 'frame',
                select: 'name price' // Only get name and price
            })
            .sort({ createdAt: -1 });
        
        // Format items to have clean frame data
        const formattedItems = cartItems.map(item => formatCartItem(item));
        
        res.status(200).json({
            success: true,
            message: formattedItems.length > 0 ? 'Cart retrieved successfully' : 'Cart is empty',
            cart: {
                _id: cart._id,
                user: cart.user,
                totalPrice: cart.totalPrice,
                items: formattedItems,
                itemCount: formattedItems.length,
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { frameId, quantity = 1 } = req.body;
        const userId = req.userId;
        
        // Validate input
        if (!frameId) {
            return res.status(400).json({
                success: false,
                message: 'Frame ID is required'
            });
        }
        
        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        // Validate frameId format
        if (!mongoose.Types.ObjectId.isValid(frameId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Frame ID format'
            });
        }
        
        // Get or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId });
        }
        
        // Check if frame exists
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({
                success: false,
                message: 'Frame not found'
            });
        }
        
        // Check quantity
        if (!frame.quantity || frame.quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Frame is out of stock'
            });
        }
        
        if (frame.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${frame.quantity} items available in stock`
            });
        }
        
        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({
            cart: cart._id,
            frame: frameId
        });
        
        if (cartItem) {
            // Update quantity if item exists
            const newQuantity = cartItem.quantity + quantity;
            
            if (frame.quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add ${quantity} more items. Only ${frame.quantity - cartItem.quantity} available`
                });
            }
            
            cartItem.quantity = newQuantity;
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart: cart._id,
                frame: frameId,
                quantity,
                price: frame.price
            });
        }
        
        // Update cart totals
        await updateCartTotals(cart._id);
        
        // Get updated cart item with minimal frame details
        const populatedCartItem = await CartItem.findById(cartItem._id)
            .populate('frame', 'name price'); // Only populate name and price
        
        // Format response
        const formattedCartItem = formatCartItem(populatedCartItem);
        
        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cartItem: formattedCartItem
        });
        
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Item already in cart'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        
        // Validate input
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        // Validate itemId format
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Cart Item ID format'
            });
        }
        
        // Find cart item with minimal frame details
        const cartItem = await CartItem.findById(itemId)
            .populate('frame', 'quantity name price'); // Get quantity for stock check, name and price for response
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        // Check quantity availability
        if (!cartItem.frame.quantity || cartItem.frame.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${cartItem.frame.quantity || 0} items available in stock`
            });
        }
        
        // Update quantity
        cartItem.quantity = quantity;
        await cartItem.save();
        
        // Update cart totals
        await updateCartTotals(cartItem.cart);
        
        // Format response
        const formattedCartItem = formatCartItem(cartItem);
        
        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            cartItem: formattedCartItem
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Validate itemId format
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Cart Item ID format'
            });
        }
        
        // Find cart item to get frame details before deleting
        const cartItem = await CartItem.findById(itemId)
            .populate('frame', 'name price'); // Get minimal frame details
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        const cartId = cartItem.cart;
        const frameDetails = {
            _id: cartItem.frame._id,
            name: cartItem.frame.name,
            price: cartItem.frame.price
        };
        
        // Delete the cart item
        await CartItem.findByIdAndDelete(itemId);
        
        // Update cart totals
        await updateCartTotals(cartId);
        
        // Get updated cart
        const cart = await Cart.findById(cartId);
        
        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            data: {
                removedItem: {
                    _id: itemId,
                    frame: frameDetails,
                    quantity: cartItem.quantity,
                    price: cartItem.price
                },
                cart: {
                    _id: cart._id,
                    totalPrice: cart.totalPrice,
                    updatedAt: cart.updatedAt
                }
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Find user's cart
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Get cart items before clearing (for response)
        const cartItems = await CartItem.find({ cart: cart._id })
            .populate('frame', 'name price');
        
        // Format items
        const formattedItems = cartItems.map(item => formatCartItem(item));
        
        // Check if cart is already empty
        if (formattedItems.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Cart is already empty',
                data: {
                    cart: {
                        _id: cart._id,
                        totalPrice: 0,
                        itemCount: 0,
                        updatedAt: cart.updatedAt
                    }
                }
            });
        }
        
        // Delete all cart items
        const result = await CartItem.deleteMany({ cart: cart._id });
        
        // Reset cart totals
        cart.totalPrice = 0;
        cart.updatedAt = Date.now();
        await cart.save();
        
        res.status(200).json({
            success: true,
            message: `Cart cleared successfully. Removed ${result.deletedCount} items`,
            data: {
                removedItems: formattedItems,
                cart: {
                    _id: cart._id,
                    totalPrice: 0,
                    itemsRemoved: result.deletedCount,
                    updatedAt: cart.updatedAt
                }
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};