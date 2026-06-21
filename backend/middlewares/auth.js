const User = require('../models/User');
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user to request
        req.user = user;
        req.user.id = user._id;
        
        console.log('🔐 Auth user:', {
            id: req.user.id,
            role: req.user.role,
            name: req.user.name,
            email: req.user.email
        });
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Admin middleware
exports.isAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
};

// Farmer middleware
exports.isFarmer = async (req, res, next) => {
    if (req.user && req.user.role === 'farmer') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Farmer rights required.' });
    }
};

// User middleware (regular user)
exports.isUser = async (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. User rights required.' });
    }
};