// Mapa-Milihan/backend/utils/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { Message } = require('../models/Message');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server, 
      path: '/ws/messages' 
    });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.userStatus = new Map(); // userId -> boolean (online status)
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      const token = this.getTokenFromUrl(req.url);
      let userId = null;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        
        // Store connection
        this.addClient(userId, ws);
        this.userStatus.set(userId, true);
        
        // Notify other clients that user is online
        this.broadcastUserStatus(userId, true);
        
        console.log(`✅ User ${userId} connected to WebSocket`);
        console.log(`📊 Total connected users: ${this.clients.size}`);

        // Send current online users to the newly connected client
        this.sendOnlineUsers(ws);
      } catch (error) {
        console.error('❌ WebSocket authentication failed:', error.message);
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(userId, ws, data);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        if (userId) {
          this.removeClient(userId, ws);
          
          // Check if user has any other connections
          if (!this.clients.has(userId) || this.clients.get(userId).size === 0) {
            this.userStatus.set(userId, false);
            this.broadcastUserStatus(userId, false);
          }
          
          console.log(`❌ User ${userId} disconnected from WebSocket`);
          console.log(`📊 Total connected users: ${this.clients.size}`);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('🚀 WebSocket server initialized on path: /ws/messages');
  }

  getTokenFromUrl(url) {
    try {
      const params = new URLSearchParams(url.split('?')[1]);
      return params.get('token');
    } catch (error) {
      return null;
    }
  }

  addClient(userId, ws) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);
  }

  removeClient(userId, ws) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  sendOnlineUsers(ws) {
    const onlineUsers = Array.from(this.userStatus.keys())
      .filter(id => this.userStatus.get(id) === true);
    
    const message = JSON.stringify({
      type: 'online_users',
      users: onlineUsers
    });
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }

  broadcastUserStatus(userId, isOnline) {
    const message = JSON.stringify({
      type: 'user_online',
      userId,
      isOnline
    });
    
    this.broadcastToAll(message);
  }

  broadcastToAll(message) {
    this.clients.forEach((clientSet) => {
      clientSet.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  async handleMessage(userId, ws, data) {
    switch (data.type) {
      case 'typing':
        await this.broadcastTypingStatus(userId, data);
        break;
      
      case 'new_message':
        await this.broadcastNewMessage(data);
        break;
      
      case 'read_receipt':
        await this.broadcastReadReceipt(data);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  async broadcastTypingStatus(userId, data) {
    const { conversationId, isTyping } = data;
    
    try {
      const conversation = await Message.findById(conversationId);
      if (!conversation) return;

      const participants = conversation.participants.map(p => p.userId.toString());
      
      participants.forEach(participantId => {
        if (participantId !== userId) {
          const clientConnections = this.clients.get(participantId);
          if (clientConnections) {
            const message = JSON.stringify({
              type: 'typing',
              conversationId,
              isTyping,
              userId
            });
            clientConnections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  }

  async broadcastNewMessage(data) {
    const { conversationId, message } = data;
    
    try {
      const conversation = await Message.findById(conversationId);
      if (!conversation) return;

      const participants = conversation.participants.map(p => p.userId.toString());
      
      participants.forEach(participantId => {
        const clientConnections = this.clients.get(participantId);
        if (clientConnections) {
          const wsMessage = JSON.stringify({
            type: 'new_message',
            conversationId,
            message,
            senderId: message.senderId
          });
          clientConnections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(wsMessage);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error broadcasting new message:', error);
    }
  }

  async broadcastReadReceipt(data) {
    const { conversationId, messageId, readerId } = data;
    
    try {
      const conversation = await Message.findById(conversationId);
      if (!conversation) return;

      const participants = conversation.participants.map(p => p.userId.toString());
      
      participants.forEach(participantId => {
        if (participantId !== readerId) {
          const clientConnections = this.clients.get(participantId);
          if (clientConnections) {
            const message = JSON.stringify({
              type: 'read_receipt',
              conversationId,
              messageId,
              readerId,
              readAt: new Date().toISOString()
            });
            clientConnections.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting read receipt:', error);
    }
  }

  // Method to be called from controllers when a new message is saved
  notifyNewMessage(conversationId, message) {
    this.broadcastNewMessage({
      conversationId,
      message
    });
  }

  // Method to be called from controllers when messages are read
  notifyReadReceipt(conversationId, messageId, readerId) {
    this.broadcastReadReceipt({
      conversationId,
      messageId,
      readerId
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.clients.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userStatus.get(userId) || false;
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.userStatus.keys())
      .filter(id => this.userStatus.get(id) === true);
  }
}

module.exports = WebSocketServer;