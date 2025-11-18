const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.get('/', authMiddleware, cartController.getCart);
router.post('/add', authMiddleware, cartController.addItemToCart );
router.put('/update', authMiddleware, cartController.updateCartItem);
router.delete('/remove/:cartItemId', authMiddleware, cartController.removeFromCart);
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;