const express = require('express');
const router = express.Router();
const forumController = require('../controllers/Forum');
const { isAuthenticatedUser } = require('../middlewares/auth');
const upload = require('../utils/Multer');

// ===================== POST ROUTES =====================

// Create a new post with media
router.post(
  '/posts', 
  isAuthenticatedUser, 
  (req, res, next) => {
    console.log('📥 POST /posts - Content-Type:', req.headers['content-type']);
    console.log('📥 POST /posts - Body:', req.body);
    next();
  },
  upload.array('media', 10),
  (req, res, next) => {
    console.log('📥 After multer - Files:', req.files ? req.files.length : 0);
    console.log('📥 After multer - Body:', req.body);
    next();
  },
  forumController.createPost
);

// Get all posts (public)
router.get('/posts', forumController.getAllPosts);

// Get single post (public)
router.get('/posts/:id', forumController.getPostById);

// Update post with media
router.put(
  '/posts/:id', 
  isAuthenticatedUser, 
  upload.array('media', 10),
  forumController.updatePost
);

// Delete post (authenticated)
router.delete('/posts/:id', isAuthenticatedUser, forumController.deletePost);

// ===================== COMMENT ROUTES =====================

// Add comment with media
router.post(
  '/posts/:id/comments', 
  isAuthenticatedUser, 
  upload.array('media', 5),
  forumController.addComment
);

// Update comment with media
router.put(
  '/posts/:id/comments/:commentId', 
  isAuthenticatedUser, 
  upload.array('media', 5),
  forumController.updateComment
);

// Delete comment (authenticated) - post owner or comment owner can delete
router.delete('/posts/:id/comments/:commentId', isAuthenticatedUser, forumController.deleteComment);

// ===================== LIKE ROUTES =====================

// Toggle like on post
router.post('/posts/:id/like', isAuthenticatedUser, forumController.toggleLikePost);

// Toggle like on comment
router.post('/posts/:id/comments/:commentId/like', isAuthenticatedUser, forumController.toggleLikeComment);

// ===================== REPORT ROUTES =====================

// Report post
router.post('/posts/:id/report', isAuthenticatedUser, forumController.reportPost);

// Report comment
router.post('/posts/:id/comments/:commentId/report', isAuthenticatedUser, forumController.reportComment);

// ===================== MESSAGE ROUTES =====================

// Send message with media
router.post(
  '/messages', 
  isAuthenticatedUser, 
  upload.array('media', 5),
  forumController.sendMessage
);

// Get user conversations
router.get('/messages/conversations', isAuthenticatedUser, forumController.getConversations);

// Get conversation messages
router.get('/messages/:id', isAuthenticatedUser, forumController.getConversationMessages);

// Report message
router.post('/messages/:id/messages/:messageId/report', isAuthenticatedUser, forumController.reportMessage);

module.exports = router;