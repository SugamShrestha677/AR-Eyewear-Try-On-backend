const Favorite = require('../models/favoriteModel');
const Frame = require('../models/frameModel');

// Add Frame to Favorites
const addFavorite = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const { frameId } = req.body;

        // Validate input
        if (!frameId) {
            return res.status(400).json({ error: 'frameId is required' });
        }

        // Check if frame exists
        const frame = await Frame.findById(frameId);
        if (!frame) {
            return res.status(404).json({ error: 'Frame not found' });
        }

        // Try to create favorite
        try {
            const favorite = await Favorite.create({ userId, frameId });
            return res.status(201).json({ 
                message: 'Frame added to favorites', 
                favorite: {
                    id: favorite._id,
                    userId: favorite.userId,
                    frameId: favorite.frameId,
                    createdAt: favorite.createdAt
                }
            });
        } catch (err) {
            // Handle duplicate key error (already favorited)
            if (err.code === 11000) {
                return res.status(200).json({ message: 'Frame already in favorites' });
            }
            throw err;
        }
    } catch (error) {
        console.log('Error adding favorite:', error);
        res.status(500).json({ error: 'Server error. Please try again later!' });
    }
};

// Remove Frame from Favorites
const removeFavorite = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const frameId = req.params.frameId || req.body.frameId;

        // Validate input
        if (!frameId) {
            return res.status(400).json({ error: 'frameId is required' });
        }

        // Delete favorite
        const deleted = await Favorite.findOneAndDelete({ userId, frameId });

        if (!deleted) {
            return res.status(200).json({ message: 'Frame was not in favorites' });
        }

        return res.status(200).json({ message: 'Frame removed from favorites' });
    } catch (error) {
        console.log('Error removing favorite:', error);
        res.status(500).json({ error: 'Server error. Please try again later!' });
    }
};

// Get Current User's Favorites
const listFavoritesForMe = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        // Fetch favorites with frame details
        const favorites = await Favorite.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'frameId',
                select: 'name brand type shape price quantity image picture colors description'
            });

        // Get total count
        const total = await Favorite.countDocuments({ userId });

        return res.status(200).json({
            favorites: favorites.map(fav => ({
                favoriteId: fav._id,
                frame: fav.frameId,
                favoritedAt: fav.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log('Error fetching favorites:', error);
        res.status(500).json({ error: 'Server error. Please try again later!' });
    }
};

// Get Any User's Favorites (Public - can be restricted later)
const listFavoritesByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        // Fetch favorites with frame details
        const favorites = await Favorite.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'frameId',
                select: 'name brand type shape price quantity image picture colors description'
            });

        // Get total count
        const total = await Favorite.countDocuments({ userId });

        return res.status(200).json({
            favorites: favorites.map(fav => ({
                favoriteId: fav._id,
                frame: fav.frameId,
                favoritedAt: fav.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log('Error fetching user favorites:', error);
        res.status(500).json({ error: 'Server error. Please try again later!' });
    }
};

// Check if a frame is favorited by current user
const isFavorited = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const { frameId } = req.params;

        if (!frameId) {
            return res.status(400).json({ error: 'frameId is required' });
        }

        const favorite = await Favorite.findOne({ userId, frameId });

        return res.status(200).json({
            isFavorited: !!favorite,
            favoriteId: favorite ? favorite._id : null
        });
    } catch (error) {
        console.log('Error checking favorite status:', error);
        res.status(500).json({ error: 'Server error. Please try again later!' });
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    listFavoritesForMe,
    listFavoritesByUserId,
    isFavorited
};
