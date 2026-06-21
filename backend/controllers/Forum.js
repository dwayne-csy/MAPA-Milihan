const { ForumPost, Message } = require('../models/Forum');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Helper: Upload files to Cloudinary using temp files - OPTIMIZED
const uploadFilesToCloudinaryWithTempFiles = async (files, folder = 'Mapa-Milihan/forum') => {
  if (!files || files.length === 0) return [];
  
  console.log(`📤 Starting upload of ${files.length} files to Cloudinary folder: ${folder}`);
  
  // Use Promise.all with concurrency limit to avoid overwhelming Cloudinary
  const concurrencyLimit = 3;
  const results = [];
  
  for (let i = 0; i < files.length; i += concurrencyLimit) {
    const chunk = files.slice(i, i + concurrencyLimit);
    const chunkPromises = chunk.map(async (file) => {
      let tempFilePath = null;
      try {
        let fileBuffer;
        
        if (file.path) {
          console.log(`📁 Reading file from disk: ${file.path}`);
          fileBuffer = fs.readFileSync(file.path);
        } else if (file.buffer) {
          fileBuffer = file.buffer;
          console.log(`📁 Using file buffer for: ${file.originalname}`);
        } else {
          throw new Error('No file data available (neither path nor buffer)');
        }
        
        const tempDir = path.join(os.tmpdir(), 'mapa_milihan_temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname) || '.jpg';
        tempFilePath = path.join(tempDir, `forum-${timestamp}-${random}${ext}`);
        
        console.log(`📝 Writing temp file: ${tempFilePath}`);
        console.log(`📝 File size: ${fileBuffer.length} bytes`);
        
        fs.writeFileSync(tempFilePath, fileBuffer);
        
        if (!fs.existsSync(tempFilePath)) {
          throw new Error('Temp file was not created');
        }
        
        const stats = fs.statSync(tempFilePath);
        console.log(`📝 Temp file written: ${stats.size} bytes`);
        
        if (stats.size === 0) {
          throw new Error('Temp file is empty');
        }
        
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');
        console.log(`🎥 Is video: ${isVideo}`);
        console.log(`📋 MIME type: ${file.mimetype}`);
        
        console.log(`☁️ Uploading to Cloudinary with type: ${isVideo ? 'video' : 'image'}...`);
        
        const result = await uploadToCloudinary(
          tempFilePath, 
          folder, 
          isVideo ? 'video' : 'image'
        );
        
        console.log(`✅ Uploaded to Cloudinary successfully: ${result.url}`);
        console.log(`📋 Public ID: ${result.public_id}`);
        console.log(`📋 Resource Type: ${result.resource_type}`);
        
        return {
          url: result.url,
          secure_url: result.url,
          public_id: result.public_id,
          mimetype: file.mimetype,
          filename: result.public_id,
          size: file.size || fileBuffer.length,
          originalname: file.originalname,
          format: file.mimetype ? file.mimetype.split('/')[1] : 'jpg',
          resource_type: result.resource_type || (isVideo ? 'video' : 'image'),
          type: isVideo ? 'video' : 'image'
        };
      } catch (error) {
        console.error('❌ Error uploading to Cloudinary:', error);
        console.error('Error details:', error.message);
        if (tempFilePath) {
          console.error('Temp file path:', tempFilePath);
          try {
            if (fs.existsSync(tempFilePath)) {
              const stats = fs.statSync(tempFilePath);
              console.error('Temp file exists, size:', stats.size);
            }
          } catch (e) {
            console.error('Error checking temp file:', e);
          }
        }
        return null;
      } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
            console.log(`🧹 Temp file deleted: ${tempFilePath}`);
          } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
          }
        }
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`🧹 Original file deleted: ${file.path}`);
          } catch (unlinkError) {
            console.error('Error deleting original file:', unlinkError);
          }
        }
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  const successfulUploads = results.filter(result => result !== null);
  console.log(`✅ Upload complete: ${successfulUploads.length}/${files.length} files uploaded successfully`);
  
  return successfulUploads;
};

// ========== CREATE POST - FIXED ==========
exports.createPost = async (req, res) => {
  try {
    console.log('📝 Create post request received');
    console.log('📋 Request body:', req.body);
    console.log('📋 Request files:', req.files ? req.files.length : 0);
    
    // LOG THE USER OBJECT TO DEBUG
    console.log('👤 User object:', JSON.stringify(req.user, null, 2));
    console.log('👤 User Type from req.user:', req.user.userType);
    console.log('👤 User Role from req.user:', req.user.role);
    
    const { title, content, category } = req.body;
    const userId = req.user.id;
    
    // FIX: Determine userType based on role
    // This is the most reliable way - check the role from the user object
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      // Fallback to userType if it exists
      userType = req.user.userType;
    }
    
    const userName = req.user.name || req.user.username || 'User';

    console.log(`👤 Final userType: ${userType}, userName: ${userName}`);
    console.log(`👤 User ID: ${userId}`);

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const files = req.files || [];
    let mediaUrls = [];

    if (files && files.length > 0) {
      try {
        const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(
          files, 
          `mapa-milihan/${userType.toLowerCase()}s/posts`
        );
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          mediaUrls = uploadedFiles.map(file => ({
            url: file.url,
            publicId: file.public_id,
            type: file.type || 'image',
            mimetype: file.mimetype,
            size: file.size,
            originalname: file.originalname
          }));
        }
      } catch (uploadError) {
        console.error('Media upload error:', uploadError);
      }
    }

    const post = new ForumPost({
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      media: mediaUrls,
      author: {
        userId: userId,
        userType: userType, // Now correctly set based on role
        name: userName
      }
    });

    await post.save();
    
    console.log(`✅ Post created successfully by ${userName} (${userType})`);
    console.log('📊 Post author data:', JSON.stringify(post.author, null, 2));
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
      mediaUploaded: mediaUrls.length
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// ========== GET ALL POSTS ==========
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    let filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await ForumPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ForumPost.countDocuments(filter);

    const userId = req.user ? req.user.id : null;
    const userType = req.user ? req.user.userType : null;

    if (userId) {
      posts.forEach(post => {
        post.isLiked = post.likes.some(like => 
          like.userId.toString() === userId && like.userType === userType
        );
        post.likeCount = post.likes.length;
        post.isOwner = post.author.userId.toString() === userId;
        // Ensure userType is properly set in the response
        if (post.author && !post.author.userType) {
          post.author.userType = 'User'; // Default fallback
        }
      });
    }

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// ========== GET SINGLE POST ==========
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user ? req.user.id : null;
    const userType = req.user ? req.user.userType : null;

    const post = await ForumPost.findById(postId).lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (userId) {
      post.isLiked = post.likes.some(like => 
        like.userId.toString() === userId && like.userType === userType
      );
      post.likeCount = post.likes.length;
      post.isOwner = post.author.userId.toString() === userId;
      
      post.comments = post.comments.map(comment => ({
        ...comment,
        isCommentOwner: comment.author.userId.toString() === userId,
        canDelete: post.author.userId.toString() === userId || comment.author.userId.toString() === userId
      }));
    }

    post.comments.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
};

// ========== UPDATE POST ==========
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content, category, removeMediaIds } = req.body;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this post'
      });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;

    const files = req.files || [];
    if (files && files.length > 0) {
      try {
        const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(files, `mapa-milihan/${userType.toLowerCase()}s/posts`);
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          const newMedia = uploadedFiles.map(file => ({
            url: file.url,
            publicId: file.public_id,
            type: file.type || 'image',
            mimetype: file.mimetype,
            size: file.size
          }));
          post.media = [...post.media, ...newMedia];
        }
      } catch (uploadError) {
        console.error('Media upload error:', uploadError);
      }
    }

    if (removeMediaIds && removeMediaIds.length > 0) {
      const idsToRemove = Array.isArray(removeMediaIds) ? removeMediaIds : [removeMediaIds];
      for (const publicId of idsToRemove) {
        const mediaToRemove = post.media.find(m => m.publicId === publicId);
        if (mediaToRemove) {
          try {
            await deleteFromCloudinary(publicId, 'auto');
            post.media = post.media.filter(m => m.publicId !== publicId);
          } catch (error) {
            console.error('Error deleting media:', error);
          }
        }
      }
    }

    post.updatedAt = Date.now();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
};

// ========== DELETE POST ==========
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isPostOwner = post.author.userId.toString() === userId;
    const isAdmin = userType === 'Admin';

    if (!isPostOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post'
      });
    }

    for (const media of post.media) {
      if (media.publicId) {
        try {
          await deleteFromCloudinary(media.publicId, 'auto');
        } catch (error) {
          console.error('Error deleting media:', error);
        }
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
};

// ========== ADD COMMENT ==========
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, parentCommentId, replyToUserId, replyToUserName } = req.body;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }
    
    const userName = req.user.name || req.user.username;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const files = req.files || [];
    let mediaUrls = [];

    if (files && files.length > 0) {
      try {
        const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(files, `mapa-milihan/${userType.toLowerCase()}s/comments`);
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          mediaUrls = uploadedFiles.map(file => ({
            url: file.url,
            publicId: file.public_id,
            type: file.type || 'image',
            mimetype: file.mimetype,
            size: file.size
          }));
        }
      } catch (uploadError) {
        console.error('Comment media upload error:', uploadError);
      }
    }

    const comment = {
      author: {
        userId,
        userType,
        name: userName
      },
      content: content || '',
      media: mediaUrls,
      parentCommentId: parentCommentId || null,
      replyToUserId: replyToUserId || null,
      replyToUserName: replyToUserName || null,
      createdAt: Date.now()
    };

    post.comments.push(comment);
    await post.save();

    const updatedPost = await ForumPost.findById(postId).lean();
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// ========== UPDATE COMMENT ==========
exports.updateComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const { content, removeMediaIds } = req.body;
    const userId = req.user.id;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this comment'
      });
    }

    if (content) comment.content = content;

    const files = req.files || [];
    if (files && files.length > 0) {
      try {
        const userType = comment.author.userType || 'User';
        const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(files, `mapa-milihan/${userType.toLowerCase()}s/comments`);
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          const newMedia = uploadedFiles.map(file => ({
            url: file.url,
            publicId: file.public_id,
            type: file.type || 'image',
            mimetype: file.mimetype,
            size: file.size
          }));
          comment.media = [...comment.media, ...newMedia];
        }
      } catch (uploadError) {
        console.error('Comment media upload error:', uploadError);
      }
    }

    if (removeMediaIds && removeMediaIds.length > 0) {
      const idsToRemove = Array.isArray(removeMediaIds) ? removeMediaIds : [removeMediaIds];
      for (const publicId of idsToRemove) {
        const mediaToRemove = comment.media.find(m => m.publicId === publicId);
        if (mediaToRemove) {
          try {
            await deleteFromCloudinary(publicId, 'auto');
            comment.media = comment.media.filter(m => m.publicId !== publicId);
          } catch (error) {
            console.error('Error deleting comment media:', error);
          }
        }
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
};

// ========== DELETE COMMENT ==========
exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isPostOwner = post.author.userId.toString() === userId;
    const isCommentAuthor = comment.author.userId.toString() === userId;
    const isAdmin = userType === 'Admin';

    if (!isPostOwner && !isCommentAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    for (const media of comment.media) {
      if (media.publicId) {
        try {
          await deleteFromCloudinary(media.publicId, 'auto');
        } catch (error) {
          console.error('Error deleting comment media:', error);
        }
      }
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: post
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
};

// ========== TOGGLE LIKE ON POST ==========
exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const likeIndex = post.likes.findIndex(like => 
      like.userId.toString() === userId && like.userType === userType
    );

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      await post.save();
      res.status(200).json({
        success: true,
        message: 'Post unliked',
        isLiked: false,
        likeCount: post.likes.length
      });
    } else {
      post.likes.push({ userId, userType });
      await post.save();
      res.status(200).json({
        success: true,
        message: 'Post liked',
        isLiked: true,
        likeCount: post.likes.length
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// ========== TOGGLE LIKE ON COMMENT ==========
exports.toggleLikeComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const likeIndex = comment.likes.findIndex(like => 
      like.userId.toString() === userId && like.userType === userType
    );

    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
      await post.save();
      res.status(200).json({
        success: true,
        message: 'Comment unliked',
        isLiked: false,
        likeCount: comment.likes.length
      });
    } else {
      comment.likes.push({ userId, userType });
      await post.save();
      res.status(200).json({
        success: true,
        message: 'Comment liked',
        isLiked: true,
        likeCount: comment.likes.length
      });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling comment like',
      error: error.message
    });
  }
};

// ========== REPORT POST ==========
exports.reportPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { reason, description } = req.body;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const existingReport = post.reports.find(report => 
      report.reportedBy.userId.toString() === userId && 
      report.reportedBy.userType === userType &&
      report.status === 'Pending'
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    const report = {
      reportedBy: {
        userId,
        userType
      },
      reason,
      description: description || '',
      status: 'Pending',
      createdAt: Date.now()
    };

    post.reports.push(report);
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Post reported successfully',
      data: post
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting post',
      error: error.message
    });
  }
};

// ========== REPORT COMMENT ==========
exports.reportComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const { reason, description } = req.body;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const existingReport = comment.reports?.find(report => 
      report.reportedBy.userId.toString() === userId && 
      report.reportedBy.userType === userType &&
      report.status === 'Pending'
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this comment'
      });
    }

    if (!comment.reports) {
      comment.reports = [];
    }

    const report = {
      reportedBy: {
        userId,
        userType
      },
      reason,
      description: description || '',
      status: 'Pending',
      createdAt: Date.now()
    };

    comment.reports.push(report);
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Comment reported successfully',
      data: post
    });
  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting comment',
      error: error.message
    });
  }
};

// ========== SEND MESSAGE ==========
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, receiverName, content } = req.body;
    const senderId = req.user.id;
    
    // Determine senderType from role
    let senderType = 'User';
    if (req.user.role === 'farmer') {
      senderType = 'Farmer';
    } else if (req.user.role === 'admin') {
      senderType = 'Admin';
    } else if (req.user.userType) {
      senderType = req.user.userType;
    }
    
    const senderName = req.user.name || req.user.username;

    if (!receiverId || !receiverType) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and type are required'
      });
    }

    const files = req.files || [];
    let mediaUrls = [];

    if (files && files.length > 0) {
      try {
        const uploadedFiles = await uploadFilesToCloudinaryWithTempFiles(files, 'mapa-milihan/messages');
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          mediaUrls = uploadedFiles.map(file => ({
            url: file.url,
            publicId: file.public_id,
            type: file.type || 'image',
            mimetype: file.mimetype,
            size: file.size
          }));
        }
      } catch (uploadError) {
        console.error('Message media upload error:', uploadError);
      }
    }

    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: senderId, userType: senderType } },
          { $elemMatch: { userId: receiverId, userType: receiverType } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Message({
        participants: [
          {
            userId: senderId,
            userType: senderType,
            name: senderName
          },
          {
            userId: receiverId,
            userType: receiverType,
            name: receiverName || 'User'
          }
        ],
        messages: [],
        lastMessageAt: Date.now()
      });
    }

    const message = {
      senderId,
      senderType,
      content: content || '',
      media: mediaUrls,
      isRead: false,
      createdAt: Date.now()
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// ========== GET CONVERSATIONS ==========
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType || 'User';

    const conversations = await Message.find({
      'participants': {
        $elemMatch: {
          userId: userId,
          userType: userType
        }
      }
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    conversations.forEach(conv => {
      conv.unreadCount = conv.messages.filter(msg => 
        msg.senderId.toString() !== userId && !msg.isRead
      ).length;
    });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// ========== GET CONVERSATION MESSAGES ==========
exports.getConversationMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(p => 
      p.userId.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    conversation.messages.forEach(msg => {
      if (msg.senderId.toString() !== userId && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
      }
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// ========== REPORT MESSAGE ==========
exports.reportMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const messageId = req.params.messageId;
    const { reason, description } = req.body;
    const userId = req.user.id;
    
    // Determine userType from role
    let userType = 'User';
    if (req.user.role === 'farmer') {
      userType = 'Farmer';
    } else if (req.user.role === 'admin') {
      userType = 'Admin';
    } else if (req.user.userType) {
      userType = req.user.userType;
    }

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const message = conversation.messages.id(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.reports) {
      message.reports = [];
    }

    const report = {
      reportedBy: {
        userId,
        userType
      },
      reason,
      description: description || '',
      status: 'Pending',
      createdAt: Date.now()
    };

    message.reports.push(report);
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message reported successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting message',
      error: error.message
    });
  }
};