const express = require('express');
const router = express.Router();
const { 
  uploadCommunitySingle, 
  uploadCommunityMultiple,
  createCommunityPostWithMedia,
  uploadForumMedia  // New forum upload function
} = require('../controllers/uploadController');
const { isAuthenticatedUser } = require('../middlewares/auth');

// Community upload routes
router.post('/community/single', isAuthenticatedUser, uploadCommunitySingle);
router.post('/community/multiple', isAuthenticatedUser, uploadCommunityMultiple);
router.post('/community/post', isAuthenticatedUser, createCommunityPostWithMedia);

// Forum upload route - NEW
router.post('/forum', isAuthenticatedUser, uploadForumMedia);

module.exports = router;