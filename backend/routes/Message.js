const express = require('express');
const router = express.Router();
const messageController = require('../controllers/Message');
const { isAuthenticatedUser } = require('../middlewares/auth');
const upload = require('../utils/multer');

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

// Report a message
router.post(
  '/conversations/:conversationId/messages/:messageId/report',
  isAuthenticatedUser,
  messageController.reportMessage
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

// ===================== CALL ROUTES =====================

// Get call history
router.get(
  '/calls/history',
  isAuthenticatedUser,
  messageController.getCallHistory
);

module.exports = router;