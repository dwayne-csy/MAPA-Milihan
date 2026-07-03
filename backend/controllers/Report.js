// Mapa-Milihan/backend/controllers/Report.js
const { ForumPost } = require('../models/Forum');
const { Message } = require('../models/Message');
const { Report } = require('../models/Report');
const mongoose = require('mongoose');

// Helper: Get user type from role
const getUserTypeFromRole = (user) => {
  if (user.role === 'farmer') return 'Farmer';
  if (user.role === 'admin') return 'Admin';
  if (user.userType) return user.userType;
  return 'User';
};

// Helper: Get content by type and ID
const getContentByType = async (contentType, contentId) => {
  let content = null;
  let parentDoc = null;
  let parentType = null;

  if (contentType === 'post') {
    content = await ForumPost.findById(contentId);
    parentType = 'ForumPost';
  } else if (contentType === 'comment') {
    const post = await ForumPost.findOne({ 'comments._id': contentId });
    if (post) {
      content = post.comments.id(contentId);
      parentDoc = post;
      parentType = 'ForumPost';
    }
  } else if (contentType === 'message') {
    const conversation = await Message.findOne({ 'messages._id': contentId });
    if (conversation) {
      content = conversation.messages.id(contentId);
      parentDoc = conversation;
      parentType = 'Message';
    }
  }

  return { content, parentDoc, parentType };
};

// Helper: Update content hide status
const updateContentHideStatus = async (contentType, contentId, hidden, userId, userType, reason) => {
  let contentInfo = {};
  let updated = false;

  if (contentType === 'post') {
    const post = await ForumPost.findById(contentId);
    if (post) {
      if (hidden) {
        post.isHidden = true;
        post.hiddenAt = Date.now();
        post.hiddenBy = { userId, userType };
        post.hideReason = reason || 'Content violates community guidelines';
      } else {
        post.isHidden = false;
        post.hiddenAt = null;
        post.hiddenBy = null;
        post.hideReason = null;
        post.unhiddenAt = Date.now();
        post.unhiddenBy = { userId, userType };
      }
      await post.save();
      updated = true;
      contentInfo = {
        type: 'post',
        title: post.title,
        author: post.author
      };
    }
  } else if (contentType === 'comment') {
    const post = await ForumPost.findOne({ 'comments._id': contentId });
    if (post) {
      const comment = post.comments.id(contentId);
      if (comment) {
        if (hidden) {
          comment.isHidden = true;
          comment.hiddenAt = Date.now();
          comment.hiddenBy = { userId, userType };
          comment.hideReason = reason || 'Comment violates community guidelines';
        } else {
          comment.isHidden = false;
          comment.hiddenAt = null;
          comment.hiddenBy = null;
          comment.hideReason = null;
          comment.unhiddenAt = Date.now();
          comment.unhiddenBy = { userId, userType };
        }
        await post.save();
        updated = true;
        contentInfo = {
          type: 'comment',
          postTitle: post.title,
          author: comment.author,
          content: comment.content ? comment.content.substring(0, 100) : ''
        };
      }
    }
  } else if (contentType === 'message') {
    const conversation = await Message.findOne({ 'messages._id': contentId });
    if (conversation) {
      const msg = conversation.messages.id(contentId);
      if (msg) {
        if (hidden) {
          msg.isHidden = true;
          msg.hiddenAt = Date.now();
          msg.hiddenBy = { userId, userType };
          msg.hideReason = reason || 'Message violates community guidelines';
        } else {
          msg.isHidden = false;
          msg.hiddenAt = null;
          msg.hiddenBy = null;
          msg.hideReason = null;
          msg.unhiddenAt = Date.now();
          msg.unhiddenBy = { userId, userType };
        }
        await conversation.save();
        updated = true;
        contentInfo = {
          type: 'message',
          sender: msg.senderName,
          content: msg.content || '[Media/Call Message]'
        };
      }
    }
  }

  return { updated, contentInfo };
};

// ========== CREATE REPORT (For Users) ==========
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);
    const userName = req.user.name || req.user.username || 'User';

    console.log(`📝 Creating report - Type: ${targetType}, ID: ${targetId}`);
    console.log(`👤 Reported by: ${userName} (${userType})`);

    // Validate inputs
    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }

    const validTypes = ['post', 'comment', 'message'];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    const validReasons = ['Spam', 'Harassment', 'Inappropriate Content', 'False Information', 'Other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
      });
    }

    // Check if content exists
    const { content, parentDoc, parentType } = await getContentByType(targetType, targetId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }

    // Check if user already reported this content
    const existingReport = await Report.findOne({
      targetType,
      targetId,
      'reportedBy.userId': userId
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content'
      });
    }

    // Determine target model
    let targetModel = 'ForumPost';
    if (targetType === 'message') {
      targetModel = 'Message';
    }

    // Create the report
    const report = new Report({
      targetType,
      targetId,
      targetModel,
      reportedBy: {
        userId,
        userType,
        name: userName
      },
      reason,
      description: description || '',
      status: 'Pending',
      actionTaken: 'none'
    });

    await report.save();

    console.log(`✅ Report created successfully: ${report._id}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report._id,
        targetType,
        targetId,
        status: report.status
      }
    });
  } catch (error) {
    console.error('❌ Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// ========== CHECK IF USER ALREADY REPORTED ==========
exports.checkUserReported = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.id;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }

    const existingReport = await Report.findOne({
      targetType,
      targetId,
      'reportedBy.userId': userId
    });

    res.status(200).json({
      success: true,
      data: {
        reported: !!existingReport,
        reportId: existingReport ? existingReport._id : null
      }
    });
  } catch (error) {
    console.error('❌ Check user reported error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking report status',
      error: error.message
    });
  }
};

// ========== GET REPORTS BY TARGET ==========
exports.getReportsByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Target type and ID are required'
      });
    }

    const reports = await Report.find({
      targetType,
      targetId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('❌ Get reports by target error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// ========== GET MY REPORTS ==========
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({
      'reportedBy.userId': userId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Report.countDocuments({
      'reportedBy.userId': userId
    });

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get my reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your reports',
      error: error.message
    });
  }
};

// ========== HIDE CONTENT (Admin) ==========
exports.hideContent = async (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const { reportId, reason } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    console.log(`🚫 Hiding content - ID: ${contentId}, Type: ${contentType}`);
    console.log(`👤 User:`, userId, userType);

    // Validate inputs
    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and type are required'
      });
    }

    const validTypes = ['post', 'comment', 'message'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if content exists
    const { content, parentDoc, parentType } = await getContentByType(contentType, contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

    // Update hide status
    const { updated, contentInfo } = await updateContentHideStatus(
      contentType, contentId, true, userId, userType, reason
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to hide content'
      });
    }

    // Update report status if reportId provided
    let reportUpdated = false;
    if (reportId) {
      try {
        const report = await Report.findById(reportId);
        if (report) {
          report.status = 'Resolved';
          report.adminNote = reason || 'Content hidden by admin';
          report.reviewedAt = Date.now();
          report.reviewedBy = {
            userId: userId,
            userType: userType,
            name: req.user.name || req.user.username || 'Admin'
          };
          report.actionTaken = 'hidden';
          report.actionDetails = `Content ${contentType} hidden by admin`;
          await report.save();
          reportUpdated = true;
          console.log(`✅ Report ${reportId} updated to Resolved`);
        }
      } catch (reportError) {
        console.error('Error updating report:', reportError);
        // Don't fail the main operation if report update fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Content hidden successfully',
      data: {
        ...contentInfo,
        reportUpdated
      }
    });
  } catch (error) {
    console.error('❌ Hide content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error hiding content',
      error: error.message
    });
  }
};

// ========== UNHIDE CONTENT (Admin) ==========
exports.unhideContent = async (req, res) => {
  try {
    const { contentId, contentType } = req.params;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    console.log(`👁️ Unhiding content - ID: ${contentId}, Type: ${contentType}`);

    // Validate inputs
    if (!contentId || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'Content ID and type are required'
      });
    }

    const validTypes = ['post', 'comment', 'message'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid content type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Check if content exists
    const { content } = await getContentByType(contentType, contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

    // Update hide status
    const { updated, contentInfo } = await updateContentHideStatus(
      contentType, contentId, false, userId, userType, null
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or not hidden'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content unhidden successfully',
      data: contentInfo
    });
  } catch (error) {
    console.error('❌ Unhide content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unhiding content',
      error: error.message
    });
  }
};

// ========== GET ALL REPORTS (Admin) ==========
exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;

    console.log(`📋 Fetching reports - Page: ${page}, Status: ${status}, Type: ${type}`);

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.targetType = type;
    }

    // Get total count
    const total = await Report.countDocuments(filter);

    // Get reports with pagination
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich reports with content details
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let contentDetails = {};
      
      try {
        const { content, parentDoc } = await getContentByType(
          report.targetType, 
          report.targetId
        );

        if (content) {
          if (report.targetType === 'post') {
            contentDetails = {
              title: content.title || 'Untitled',
              content: content.content ? content.content.substring(0, 200) : '',
              author: content.author,
              category: content.category,
              media: content.media || [],
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt
            };
          } else if (report.targetType === 'comment') {
            contentDetails = {
              postTitle: parentDoc ? parentDoc.title || '' : '',
              content: content.content ? content.content.substring(0, 200) : '',
              author: content.author,
              parentCommentId: content.parentCommentId || null,
              replyToUserName: content.replyToUserName || null,
              postAuthor: parentDoc ? parentDoc.author : null,
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt,
              postId: parentDoc ? parentDoc._id : null
            };
          } else if (report.targetType === 'message') {
            const otherParticipant = parentDoc && parentDoc.participants ? 
              parentDoc.participants.find(
                p => p.userId && p.userId.toString() !== content.senderId.toString()
              ) : null;

            contentDetails = {
              content: content.content || '[Media/Call Message]',
              sender: {
                userId: content.senderId,
                userType: content.senderType,
                name: content.senderName
              },
              receiver: otherParticipant ? {
                userId: otherParticipant.userId,
                userType: otherParticipant.userType,
                name: otherParticipant.name
              } : null,
              media: content.media || [],
              callType: content.callType || 'none',
              callStatus: content.callStatus || 'none',
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt,
              conversationId: parentDoc ? parentDoc._id : null
            };
          }
        }
      } catch (error) {
        console.error(`Error enriching report ${report._id}:`, error);
      }

      return {
        ...report,
        contentDetails,
        reportId: report._id
      };
    }));

    console.log(`✅ Found ${total} reports, returning ${enrichedReports.length}`);

    res.status(200).json({
      success: true,
      data: enrichedReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// ========== GET REPORT STATISTICS (Admin) ==========
exports.getReportStatistics = async (req, res) => {
  try {
    const stats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      byType: {
        post: 0,
        comment: 0,
        message: 0
      },
      byReason: {}
    };

    // Get all reports
    const reports = await Report.find({}).lean();

    reports.forEach(report => {
      stats.total++;
      
      // Count by status
      if (report.status === 'Pending') stats.pending++;
      else if (report.status === 'Reviewed') stats.reviewed++;
      else if (report.status === 'Resolved') stats.resolved++;
      else if (report.status === 'Dismissed') stats.dismissed++;
      
      // Count by type
      if (report.targetType === 'post') stats.byType.post++;
      else if (report.targetType === 'comment') stats.byType.comment++;
      else if (report.targetType === 'message') stats.byType.message++;
      
      // Count by reason
      if (report.reason) {
        stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get report statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report statistics',
      error: error.message
    });
  }
};

// ========== UPDATE REPORT STATUS (Admin) ==========
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNote } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    console.log(`📋 Updating report ${reportId} to status: ${status}`);

    if (!status || !['Pending', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Pending, Reviewed, Resolved, or Dismissed'
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report status
    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    report.reviewedAt = Date.now();
    report.reviewedBy = {
      userId: userId,
      userType: userType,
      name: req.user.name || req.user.username || 'Admin'
    };

    // If resolving, set action taken based on content status
    if (status === 'Resolved' || status === 'Dismissed') {
      // Check if content is hidden
      const { content } = await getContentByType(report.targetType, report.targetId);
      if (content && content.isHidden) {
        report.actionTaken = 'hidden';
      } else if (status === 'Dismissed') {
        report.actionTaken = 'none';
      }
    }

    await report.save();

    console.log(`✅ Updated report status to ${status}`);

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      data: { reportId: report._id, status, reportType: report.targetType }
    });
  } catch (error) {
    console.error('❌ Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report status',
      error: error.message
    });
  }
};

// ========== GET HIDDEN CONTENT (Admin) ==========
exports.getHiddenContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    let hiddenContent = [];

    // Get hidden posts
    if (type === 'post' || !type) {
      const posts = await ForumPost.find({ isHidden: true })
        .select('title content author category media createdAt hiddenAt hiddenBy hideReason')
        .sort({ hiddenAt: -1 })
        .lean();

      posts.forEach(post => {
        hiddenContent.push({
          _id: post._id,
          type: 'post',
          title: post.title || '',
          content: post.content ? post.content.substring(0, 200) : '',
          author: post.author,
          category: post.category,
          media: post.media || [],
          hiddenAt: post.hiddenAt,
          hiddenBy: post.hiddenBy,
          hideReason: post.hideReason,
          createdAt: post.createdAt
        });
      });
    }

    // Get hidden comments
    if (type === 'comment' || !type) {
      const posts = await ForumPost.find({ 'comments.isHidden': true })
        .select('title content author comments')
        .lean();

      posts.forEach(post => {
        if (post.comments) {
          post.comments.forEach(comment => {
            if (comment.isHidden) {
              hiddenContent.push({
                _id: comment._id,
                postId: post._id,
                postTitle: post.title || '',
                type: 'comment',
                content: comment.content ? comment.content.substring(0, 200) : '',
                author: comment.author,
                parentCommentId: comment.parentCommentId || null,
                replyToUserName: comment.replyToUserName || null,
                hiddenAt: comment.hiddenAt,
                hiddenBy: comment.hiddenBy,
                hideReason: comment.hideReason,
                createdAt: comment.createdAt
              });
            }
          });
        }
      });
    }

    // Get hidden messages
    if (type === 'message' || !type) {
      const conversations = await Message.find({ 'messages.isHidden': true })
        .select('participants messages')
        .lean();

      conversations.forEach(conversation => {
        if (conversation.messages) {
          conversation.messages.forEach(msg => {
            if (msg.isHidden) {
              const otherParticipant = conversation.participants ? 
                conversation.participants.find(
                  p => p.userId && p.userId.toString() !== msg.senderId.toString()
                ) : null;

              hiddenContent.push({
                _id: msg._id,
                conversationId: conversation._id,
                type: 'message',
                content: msg.content || '[Media/Call Message]',
                sender: {
                  userId: msg.senderId,
                  userType: msg.senderType,
                  name: msg.senderName
                },
                receiver: otherParticipant ? {
                  userId: otherParticipant.userId,
                  userType: otherParticipant.userType,
                  name: otherParticipant.name
                } : null,
                media: msg.media || [],
                callType: msg.callType || 'none',
                callStatus: msg.callStatus || 'none',
                hiddenAt: msg.hiddenAt,
                hiddenBy: msg.hiddenBy,
                hideReason: msg.hideReason,
                createdAt: msg.createdAt
              });
            }
          });
        }
      });
    }

    // Sort by hidden date
    hiddenContent.sort((a, b) => {
      const dateA = a.hiddenAt ? new Date(a.hiddenAt) : new Date(0);
      const dateB = b.hiddenAt ? new Date(b.hiddenAt) : new Date(0);
      return dateB - dateA;
    });

    const total = hiddenContent.length;
    const paginatedContent = hiddenContent.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedContent,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get hidden content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hidden content',
      error: error.message
    });
  }
};

// ========== DELETE REPORT (Admin) ==========
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log(`✅ Deleted report ${reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// ========== BULK UPDATE REPORTS (Admin) ==========
exports.bulkUpdateReports = async (req, res) => {
  try {
    const { reportIds, status, adminNote } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report IDs array is required'
      });
    }

    if (!status || !['Pending', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      { 
        $set: { 
          status, 
          ...(adminNote && { adminNote }),
          reviewedAt: Date.now(),
          reviewedBy: {
            userId: req.user.id,
            userType: getUserTypeFromRole(req.user),
            name: req.user.name || req.user.username || 'Admin'
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} reports`,
      data: {
        updated: result.modifiedCount,
        total: reportIds.length
      }
    });
  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk updating reports',
      error: error.message
    });
  }
};