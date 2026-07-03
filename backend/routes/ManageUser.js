// Mapa-Milihan/backend/routes/ManageUser.js

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  changeUserRole,
  deactivateUser,
  activateUser,
  toggleUserActive,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getUserStats,
  bulkDeactivateUsers,
  bulkSoftDeleteUsers
} = require('../controllers/ManageUser');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION AND ADMIN ROLE
// ============================================

// GET - Get all users with pagination and filters
router.get(
  '/users',
  isAuthenticatedUser,
  isAdmin,
  getAllUsers
);

// GET - Get user statistics
router.get(
  '/users/stats',
  isAuthenticatedUser,
  isAdmin,
  getUserStats
);

// GET - Get single user by ID
router.get(
  '/users/:userId',
  isAuthenticatedUser,
  isAdmin,
  getUserById
);

// PUT - Change user role
router.put(
  '/users/:userId/role',
  isAuthenticatedUser,
  isAdmin,
  changeUserRole
);

// PUT - Deactivate user
router.put(
  '/users/:userId/deactivate',
  isAuthenticatedUser,
  isAdmin,
  deactivateUser
);

// PUT - Activate user
router.put(
  '/users/:userId/activate',
  isAuthenticatedUser,
  isAdmin,
  activateUser
);

// PUT - Toggle user active status (activate/deactivate toggle)
router.put(
  '/users/:userId/toggle-active',
  isAuthenticatedUser,
  isAdmin,
  toggleUserActive
);

// PUT - Soft delete user (moves to trash)
router.put(
  '/users/:userId/soft-delete',
  isAuthenticatedUser,
  isAdmin,
  softDeleteUser
);

// PUT - Restore user from soft delete
router.put(
  '/users/:userId/restore',
  isAuthenticatedUser,
  isAdmin,
  restoreUser
);

// DELETE - Permanently delete user (hard delete)
router.delete(
  '/users/:userId/hard-delete',
  isAuthenticatedUser,
  isAdmin,
  hardDeleteUser
);

// POST - Bulk deactivate users
router.post(
  '/users/bulk/deactivate',
  isAuthenticatedUser,
  isAdmin,
  bulkDeactivateUsers
);

// POST - Bulk soft delete users
router.post(
  '/users/bulk/soft-delete',
  isAuthenticatedUser,
  isAdmin,
  bulkSoftDeleteUsers
);

module.exports = router;