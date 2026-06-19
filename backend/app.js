const express = require('express');
const app = express();
const cors = require('cors')

// ========== CORS CONFIGURATION ==========
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== OTHER MIDDLEWARE ==========
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));



// ========== ROUTES ==========
const userRoutes = require('./routes/User');
const productRoutes = require('./routes/Product');
const groqChatbotRoutes = require('./routes/groqchatbot');


// Use routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/groqchatbot', groqChatbotRoutes);



// ========== HEALTH CHECK ENDPOINT ==========
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});



module.exports = app;