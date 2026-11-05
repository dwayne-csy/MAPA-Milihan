// Mapa-Milihan/backend/controllers/ManageUser.js

const User = require('../models/User');
const { deleteFromCloudinary } = require('../utils/Cloudinary');

// ========== GET ALL USERS ==========
exports.getAllUsers = async (req, res) => {
  try {
    console.log('📋 Admin fetching all users');
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const { role, isActive, isVerified, isDeleted, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`✅ Found ${users.length} users (total: ${totalUsers})`);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit
      }
    });
  } catch (error) {
    console.error('❌ GET ALL USERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// ========== GET SINGLE USER ==========
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User found: ${user.email}`);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ GET USER BY ID ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// ========== CHANGE USER ROLE ==========
exports.changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const validRoles = ['user', 'farmer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Prevent admin from changing their own role
    if (req.user.id.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ Role changed for ${user.email} to ${role}`);
    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('❌ CHANGE USER ROLE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user role',
      error: error.message
    });
  }
};

// ========== DEACTIVATE USER ==========
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User deactivated: ${user.email}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} has been deactivated`,
      user
    });
  } catch (error) {
    console.error('❌ DEACTIVATE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message
    });
  }
};

// ========== ACTIVATE USER ==========
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User activated: ${user.email}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} has been activated`,
      user
    });
  } catch (error) {
    console.error('❌ ACTIVATE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message
    });
  }
};

// ========== TOGGLE USER ACTIVE STATUS ==========
exports.toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent admin from toggling themselves
    if (req.user.id.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own account status'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpire;
    delete userResponse.emailVerificationToken;
    delete userResponse.emailVerificationExpire;

    console.log(`✅ User status toggled: ${user.email} is now ${user.isActive ? 'active' : 'inactive'}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} is now ${user.isActive ? 'active' : 'inactive'}`,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ TOGGLE USER ACTIVE ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
};

// ========== DELETE USER (Soft Delete) ==========
exports.softDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true, isActive: false },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`🗑️ User soft deleted: ${user.email}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} has been deleted (soft delete)`,
      user
    });
  } catch (error) {
    console.error('❌ SOFT DELETE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// ========== PERMANENTLY DELETE USER (Hard Delete) ==========
exports.hardDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id.toString() === userId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete avatar from Cloudinary if it exists and is not a default avatar
    if (user.avatar && user.avatar.public_id && 
        !user.avatar.url?.includes('ui-avatars.com') &&
        !user.avatar.url?.includes('default-avatar')) {
      try {
        await deleteFromCloudinary(user.avatar.public_id);
        console.log('✅ User avatar deleted from Cloudinary');
      } catch (err) {
        console.warn('⚠️ Could not delete avatar:', err.message);
      }
    }

    await user.deleteOne();
    console.log(`🗑️ User permanently deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${user.email} has been permanently deleted`
    });
  } catch (error) {
    console.error('❌ HARD DELETE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete user',
      error: error.message
    });
  }
};

// ========== RESTORE USER (from soft delete) ==========
exports.restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: false, isActive: true },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User restored: ${user.email}`);
    res.status(200).json({
      success: true,
      message: `User ${user.email} has been restored`,
      user
    });
  } catch (error) {
    console.error('❌ RESTORE USER ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user',
      error: error.message
    });
  }
};

// ========== GET USER STATISTICS ==========
exports.getUserStats = async (req, res) => {
  try {
    console.log('📊 Admin fetching user statistics');

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const deletedUsers = await User.countDocuments({ isDeleted: true });
    
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const authProviderStats = await User.aggregate([
      { $group: { _id: '$authProvider', count: { $sum: 1 } } }
    ]);

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        deleted: deletedUsers,
        recentRegistrations,
        roles: roleStats,
        authProviders: authProviderStats
      }
    });
  } catch (error) {
    console.error('❌ GET USER STATS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// ========== BULK DEACTIVATE USERS ==========
exports.bulkDeactivateUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    // Prevent admin from deactivating themselves
    const filteredIds = userIds.filter(id => id.toString() !== req.user.id.toString());

    if (filteredIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: filteredIds } },
      { isActive: false }
    );

    console.log(`✅ Bulk deactivated ${result.modifiedCount} users`);
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users deactivated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ BULK DEACTIVATE USERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate users',
      error: error.message
    });
  }
};

// ========== BULK DELETE USERS (Soft Delete) ==========
exports.bulkSoftDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    // Prevent admin from deleting themselves
    const filteredIds = userIds.filter(id => id.toString() !== req.user.id.toString());

    if (filteredIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: filteredIds } },
      { isDeleted: true, isActive: false }
    );

    console.log(`🗑️ Bulk soft deleted ${result.modifiedCount} users`);
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users deleted successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ BULK SOFT DELETE USERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete users',
      error: error.message
    }); 
  }
};