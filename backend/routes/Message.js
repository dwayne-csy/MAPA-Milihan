// Mapa-Milihan/backend/routes/Message.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/Message');
const { isAuthenticatedUser } = require('../middlewares/auth');
const upload = require('../utils/Multer');

// ===================== MESSAGE ROUTES =====================

// Send message with media
router.post(
  '/send',
  isAuthenticatedUser,
  upload.array('media', 10),
  messageController.sendMessage
);

// Get all conversations for the current user
router.get(
  '/conversations',
  isAuthenticatedUser,
  messageController.getConversations
);

// Get messages from a specific conversation
router.get(
  '/conversations/:id',
  isAuthenticatedUser,
  messageController.getConversationMessages
);

// Get or create a conversation with a specific user
router.post(
  '/conversations/get-or-create',
  isAuthenticatedUser,
  messageController.getOrCreateConversation
);

// Get unread message count
router.get(
  '/unread/count',
  isAuthenticatedUser,
  messageController.getUnreadCount
);

// Mark messages as read in a conversation
router.put(
  '/conversations/:conversationId/read',
  isAuthenticatedUser,
  messageController.markAsRead
);

// ===================== MESSAGE ACTIONS =====================

// Delete a message (for everyone or just for me)
router.delete(
  '/conversations/:conversationId/messages/:messageId',
  isAuthenticatedUser,
  messageController.deleteMessage
);

// Add reaction to a message
router.post(
  '/conversations/:conversationId/messages/:messageId/reactions',
  isAuthenticatedUser,
  messageController.addReaction
);

// ===================== BLOCK/UNBLOCK ROUTES =====================

// Block a user
router.post(
  '/block',
  isAuthenticatedUser,
  messageController.blockUser
);

// Unblock a user
router.post(
  '/unblock',
  isAuthenticatedUser,
  messageController.unblockUser
);

module.exports = router;