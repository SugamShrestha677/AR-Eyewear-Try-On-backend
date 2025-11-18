
// auth.js - alternative (more common)
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token not provided' });
        }

        const payload = jwt.verify(token, config.JWT_SECRET);
        
        // Get user from database (optional but recommended)
        const user = await User.findById(payload.userId).select('-password');
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Attach full user object to request
        req.user = user;
        
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