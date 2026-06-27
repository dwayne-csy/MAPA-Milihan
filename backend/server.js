const dotenv = require('dotenv');

// Load environment variables FIRST, before any other imports
const result = dotenv.config({ path: './config/.env' });

if (result.error) {
  console.log('❌ Error loading .env from ./config/.env, trying .env in current directory');
  dotenv.config({ path: '.env' });
}

console.log('✅ Environment variables loaded:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');

// Now import other modules AFTER environment variables are loaded
const app = require('./app');
const connectDatabase = require('./config/db');
const http = require('http');

// Import WebSocket server
const WebSocketServer = require('./utils/websocket');
const { setWebSocketServer } = require('./controllers/Message');

connectDatabase();

// Create HTTP server from the Express app
const server = http.createServer(app);

// Initialize WebSocket Server with the HTTP server
const wsServer = new WebSocketServer(server);

// Set WebSocket server instance in controllers
setWebSocketServer(wsServer);

// Make wsServer available globally (optional, but useful)
global.wsServer = wsServer;

// Start the server
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`🚀 Server started on port: ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws/messages`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});