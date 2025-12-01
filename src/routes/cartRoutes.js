// cartRoutes.js - Using Express Router
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth'); // Your existing auth middleware

// All cart routes require authentication
router.use(auth);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/item/:itemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', cartController.removeCartItem);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

module.exports = router;