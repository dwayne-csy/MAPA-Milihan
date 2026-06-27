const Profile = require('../models/Profile');
const User = require('../models/User');
const { ForumPost } = require('../models/Forum');

// ========== GET PROFILE ==========
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user data - only what's needed
    const user = await User.findById(userId)
      .select('name email avatar contact address role isVerified createdAt');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Get or create profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
      await profile.save();
    }

    // Get user's posts with author details
    const posts = await ForumPost.find({ 'author.userId': userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('content media createdAt likes comments author')
      .lean();

    // Format posts to include author name and avatar
    const formattedPosts = posts.map(post => {
      // Get author data from the post
      const authorData = post.author || {};
      
      // If author has userId, try to get the full user data
      let authorName = authorData.name || 'Unknown User';
      let authorAvatar = authorData.avatar || '/default-avatar.png';
      
      return {
        ...post,
        authorName: authorName,
        authorAvatar: authorAvatar,
        author: {
          name: authorName,
          avatar: authorAvatar,
          userId: authorData.userId || null
        }
      };
    });

    // Check if current user is following this profile
    let isFollowing = false;
    if (req.user && req.user.id) {
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      if (currentUserProfile) {
        isFollowing = currentUserProfile.following.includes(userId);
      }
    }

    // Check if this is the user's own profile
    const isOwnProfile = req.user && req.user.id === userId;

    // Prepare response data
    const profileData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.role === 'farmer' ? 'Farmer' : user.role === 'admin' ? 'Admin' : 'User',
        avatar: user.avatar,
        contact: user.contact || '',
        address: user.address || { city: '', barangay: '', street: '', zipcode: '' },
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      stats: {
        followersCount: profile.followers.length || 0,
        followingCount: profile.following.length || 0,
        postsCount: posts.length || 0
      },
      posts: formattedPosts || [],
      isFollowing: isFollowing,
      isOwnProfile: isOwnProfile
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== UPDATE PROFILE ==========
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is updating their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to update this profile' 
      });
    }

    const { address, contact } = req.body;

    // Update User model fields
    const userUpdateData = {};
    if (contact !== undefined) userUpdateData.contact = contact;
    if (address !== undefined) userUpdateData.address = address;

    // Update User if there are fields to update
    if (Object.keys(userUpdateData).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdateData, { new: true });
    }

    // Get updated profile data
    const updatedUser = await User.findById(userId)
      .select('name email avatar contact address role isVerified createdAt');

    const updatedProfile = await Profile.findOne({ userId });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
        stats: {
          followersCount: updatedProfile?.followers.length || 0,
          followingCount: updatedProfile?.following.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== FOLLOW USER ==========
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot follow yourself' 
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Get both profiles
    let currentUserProfile = await Profile.findOne({ userId: currentUserId });
    let targetUserProfile = await Profile.findOne({ userId });

    // Create profiles if they don't exist
    if (!currentUserProfile) {
      currentUserProfile = new Profile({ userId: currentUserId });
      await currentUserProfile.save();
    }
    if (!targetUserProfile) {
      targetUserProfile = new Profile({ userId });
      await targetUserProfile.save();
    }

    // Check if already following
    if (currentUserProfile.following.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Already following this user' 
      });
    }

    // Add to following and followers
    currentUserProfile.following.push(userId);
    targetUserProfile.followers.push(currentUserId);

    await currentUserProfile.save();
    await targetUserProfile.save();

    res.status(200).json({
      success: true,
      message: 'User followed successfully',
      data: {
        isFollowing: true,
        followersCount: targetUserProfile.followers.length
      }
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== UNFOLLOW USER ==========
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot unfollow yourself' 
      });
    }

    const currentUserProfile = await Profile.findOne({ userId: currentUserId });
    const targetUserProfile = await Profile.findOne({ userId });

    if (!currentUserProfile || !targetUserProfile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    // Check if following
    if (!currentUserProfile.following.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Not following this user' 
      });
    }

    // Remove from following and followers
    currentUserProfile.following = currentUserProfile.following.filter(
      id => id.toString() !== userId
    );
    targetUserProfile.followers = targetUserProfile.followers.filter(
      id => id.toString() !== currentUserId
    );

    await currentUserProfile.save();
    await targetUserProfile.save();

    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully',
      data: {
        isFollowing: false,
        followersCount: targetUserProfile.followers.length
      }
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== GET FOLLOW STATUS ==========
exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(200).json({
        success: true,
        data: {
          isFollowing: false,
          isOwnProfile: true
        }
      });
    }

    const currentUserProfile = await Profile.findOne({ userId: currentUserId });
    if (!currentUserProfile) {
      return res.status(200).json({
        success: true,
        data: {
          isFollowing: false,
          isOwnProfile: false
        }
      });
    }

    const isFollowing = currentUserProfile.following.includes(userId);

    res.status(200).json({
      success: true,
      data: {
        isFollowing,
        isOwnProfile: false
      }
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== GET USER POSTS (with pagination) ==========
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await ForumPost.find({ 'author.userId': userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('content media createdAt likes comments author')
      .lean();

    // Format posts to include author name and avatar
    const formattedPosts = posts.map(post => {
      const authorData = post.author || {};
      
      let authorName = authorData.name || 'Unknown User';
      let authorAvatar = authorData.avatar || '/default-avatar.png';
      
      return {
        ...post,
        authorName: authorName,
        authorAvatar: authorAvatar,
        author: {
          name: authorName,
          avatar: authorAvatar,
          userId: authorData.userId || null
        }
      };
    });

    const total = await ForumPost.countDocuments({ 'author.userId': userId });

    res.status(200).json({
      success: true,
      data: {
        posts: formattedPosts,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== GET FOLLOWERS ==========
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get followers with pagination
    const followers = await User.find({
      _id: { $in: profile.followers }
    })
    .select('name email avatar contact address role createdAt')
    .skip(skip)
    .limit(parseInt(limit));

    // Map userType from role
    const followersWithType = followers.map(follower => ({
      ...follower.toObject(),
      userType: follower.role === 'farmer' ? 'Farmer' : follower.role === 'admin' ? 'Admin' : 'User'
    }));

    // Check if current user follows each follower
    let followersWithStatus = followersWithType;
    if (req.user) {
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      followersWithStatus = followersWithType.map(follower => ({
        ...follower,
        isFollowing: currentUserProfile?.following.includes(follower._id) || false
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        followers: followersWithStatus,
        total: profile.followers.length,
        page: parseInt(page),
        totalPages: Math.ceil(profile.followers.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// ========== GET FOLLOWING ==========
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get following with pagination
    const following = await User.find({
      _id: { $in: profile.following }
    })
    .select('name email avatar contact address role createdAt')
    .skip(skip)
    .limit(parseInt(limit));

    // Map userType from role
    const followingWithType = following.map(user => ({
      ...user.toObject(),
      userType: user.role === 'farmer' ? 'Farmer' : user.role === 'admin' ? 'Admin' : 'User'
    }));

    // Check if current user follows each person
    let followingWithStatus = followingWithType;
    if (req.user) {
      const currentUserProfile = await Profile.findOne({ userId: req.user.id });
      followingWithStatus = followingWithType.map(user => ({
        ...user,
        isFollowing: currentUserProfile?.following.includes(user._id) || false
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        following: followingWithStatus,
        total: profile.following.length,
        page: parseInt(page),
        totalPages: Math.ceil(profile.following.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};