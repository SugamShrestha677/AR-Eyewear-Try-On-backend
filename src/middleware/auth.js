const jwt = require('jsonwebtoken');
const config = require('../config/config');

// JWT Authentication Middleware
const auth = (req, res, next) => {
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
        
        // Attach userId to request object
        req.userId = payload.userId;
        
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
