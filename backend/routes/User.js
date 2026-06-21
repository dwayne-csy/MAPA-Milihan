const express = require('express');
const upload = require('../utils/Multer');
const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateProfile,
  updatePassword,
  firebaseGoogleAuth,
  firebaseFacebookAuth, 
  checkEmailVerification,
  resendVerificationEmail,
  getUserAvatar
} = require('../controllers/User');

const { isAuthenticatedUser } = require('../middlewares/auth');

const router = express.Router();

// ========== AUTHENTICATION ROUTES ==========
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);

// ========== FIREBASE OAUTH ROUTES ==========
router.post('/firebase/auth/google', firebaseGoogleAuth);
router.post('/firebase/auth/facebook', firebaseFacebookAuth);

// ========== EMAIL VERIFICATION ROUTES ==========
router.post('/check-verification', checkEmailVerification);
router.post('/resend-verification', resendVerificationEmail);

// ========== PASSWORD MANAGEMENT ROUTES ==========
router.post('/password/forgot', forgotPassword);
router.put('/password/reset/:token', resetPassword);
router.put('/password/update', isAuthenticatedUser, updatePassword);

// ========== USER PROFILE ROUTES ==========
router.get('/me', isAuthenticatedUser, getUserProfile);
router.put('/me/update', isAuthenticatedUser, upload.single('avatar'), updateProfile);

// ========== USER AVATAR ROUTE ==========
router.get('/:userId/avatar', getUserAvatar);

module.exports = router;