const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const auth = require('../middleware/auth');

// Add frame to favorites (requires authentication)
router.post('/add', auth, favoriteController.addFavorite);

// Remove frame from favorites (requires authentication)
// Allow removal by specifying frameId in params or body
router.delete('/remove', auth, favoriteController.removeFavorite);
router.delete('/:favoriteId', auth, favoriteController.removeFavorite);

// Get current user's favorites (requires authentication)
router.get('/me', auth, favoriteController.listFavoritesForMe);

// Get any user's favorites (public - no auth required, but can be restricted later)
router.get('/:userId', favoriteController.listFavoritesByUserId);





module.exports = router;
