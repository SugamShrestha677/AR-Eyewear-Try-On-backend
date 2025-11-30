const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/userModel');

// JWT Authentication Middleware
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];

        // Check if Authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token not provided' });
        }

        // Verify token
        const payload = jwt.verify(token, config.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if password was changed after token was issued
        if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
            return res.status(401).json({ error: 'Password was changed recently. Please login again.' });
        }

        // Attach userId and user to request object
        req.userId = payload.userId;
        req.user = user;
        
        // Continue to next middleware/route handler
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.log('Auth middleware error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = auth;