const express = require('express');
const app = express();
const cors = require('cors');

// ========== CORS CONFIGURATION ==========
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== OTHER MIDDLEWARE ==========
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ========== ROUTES ==========
const userRoutes = require('./routes/User');
const productRoutes = require('./routes/Product');
const groqChatbotRoutes = require('./routes/groqchatbot');
const forumRoutes = require('./routes/Forum');
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require('./routes/Cart');
const orderRoutes = require('./routes/Order');

// Use routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/groqchatbot', groqChatbotRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);

// ========== HEALTH CHECK ENDPOINT ==========
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;