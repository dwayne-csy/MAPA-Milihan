const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middlewares/auth');
const profileController = require('../controllers/Profile');

// ===================== PROFILE ROUTES =====================

// Get profile - shows avatar, name, posts, followers/following, address, contact
router.get('/:userId', isAuthenticatedUser, profileController.getProfile);

// Update profile (address, contact)
router.put('/:userId', isAuthenticatedUser, profileController.updateProfile);

// ===================== FOLLOW ROUTES =====================

// Follow/Unfollow
router.post('/:userId/follow', isAuthenticatedUser, profileController.followUser);
router.delete('/:userId/follow', isAuthenticatedUser, profileController.unfollowUser);

// Get follow status
router.get('/:userId/follow/status', isAuthenticatedUser, profileController.getFollowStatus);

// Get followers and following lists
router.get('/:userId/followers', isAuthenticatedUser, profileController.getFollowers);
router.get('/:userId/following', isAuthenticatedUser, profileController.getFollowing);

// ===================== POST ROUTES =====================

// Get user posts (with pagination)
router.get('/:userId/posts', isAuthenticatedUser, profileController.getUserPosts);

module.exports = router;