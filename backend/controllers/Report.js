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

// Helper: Get ID string from object or string
const getIdString = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id._id) return id._id.toString();
  if (typeof id === 'object' && id.toString) return id.toString();
  return null;
};

// Helper: Check if ID is valid ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
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

// Helper: Get user details by ID
const getUserDetails = async (userId) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('name email avatar userType role');
    if (user) {
      return {
        userId: user._id,
        name: user.name || 'Unknown',
        email: user.email || '',
        avatar: user.avatar?.url || null,
        userType: user.userType || user.role || 'User'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
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

// ========== REPORT MESSAGE ==========
exports.reportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { conversationId, reason, description } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);
    const userName = req.user.name || req.user.username || 'User';

    console.log(`📝 Reporting message ${messageId}`);
    console.log(`👤 Reported by: ${userName} (${userType})`);
    console.log(`📋 Reason: ${reason}`);

    // Validate inputs
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
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

    // Check if message exists in a conversation
    let conversation = null;
    let message = null;
    
    if (conversationId) {
      conversation = await Message.findOne({ 
        _id: conversationId,
        'messages._id': messageId 
      });
      if (conversation) {
        message = conversation.messages.id(messageId);
      }
    } else {
      conversation = await Message.findOne({ 'messages._id': messageId });
      if (conversation) {
        message = conversation.messages.id(messageId);
      }
    }

    if (!conversation || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is a participant
    let isParticipant = false;
    for (const p of conversation.participants) {
      const pUserId = getIdString(p.userId);
      if (pUserId === userId.toString()) {
        isParticipant = true;
        break;
      }
    }

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Check if user already reported this message
    const existingReport = await Report.findOne({
      targetType: 'message',
      targetId: messageId,
      'reportedBy.userId': userId
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this message'
      });
    }

    // Create the report using the centralized Report model
    const report = new Report({
      targetType: 'message',
      targetId: messageId,
      targetModel: 'Message',
      reportedBy: {
        userId: userId,
        userType: userType,
        name: userName
      },
      reason: reason,
      description: description || '',
      status: 'Pending',
      actionTaken: 'none',
      metadata: {
        conversationId: conversation._id,
        messageContent: message.content || '[Media/Call Message]',
        senderId: message.senderId,
        senderName: message.senderName,
        senderType: message.senderType
      }
    });

    await report.save();

    console.log(`✅ Message report created successfully: ${report._id}`);

    res.status(201).json({
      success: true,
      message: 'Message reported successfully',
      data: {
        reportId: report._id,
        messageId: message._id,
        conversationId: conversation._id,
        status: report.status
      }
    });
  } catch (error) {
    console.error('❌ Report message error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error reporting message',
      error: error.message
    });
  }
};

// ========== GET MESSAGE REPORTS (Admin) ==========
exports.getMessageReports = async (req, res) => {
  try {
    const { messageId } = req.params;

    console.log(`📋 Fetching reports for message ${messageId}`);

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }

    const reports = await Report.find({
      targetType: 'message',
      targetId: messageId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('❌ Get message reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message reports',
      error: error.message
    });
  }
};

// ========== GET ALL MESSAGE REPORTS (Admin) ==========
exports.getAllMessageReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    console.log(`📋 Fetching all message reports - Page: ${page}, Status: ${status}`);

    const filter = { targetType: 'message' };
    if (status) {
      filter.status = status;
    }

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let messageDetails = {};
      
      try {
        const conversation = await Message.findOne({ 'messages._id': report.targetId });
        if (conversation) {
          const message = conversation.messages.id(report.targetId);
          if (message) {
            const otherParticipant = conversation.participants ? 
              conversation.participants.find(
                p => p.userId && p.userId.toString() !== message.senderId.toString()
              ) : null;

            messageDetails = {
              content: message.content || '[Media/Call Message]',
              sender: {
                userId: message.senderId,
                userType: message.senderType,
                name: message.senderName
              },
              receiver: otherParticipant ? {
                userId: otherParticipant.userId,
                userType: otherParticipant.userType,
                name: otherParticipant.name
              } : null,
              media: message.media || [],
              callType: message.callType || 'none',
              callStatus: message.callStatus || 'none',
              isHidden: message.isHidden || false,
              hiddenAt: message.hiddenAt || null,
              hiddenBy: message.hiddenBy || null,
              hideReason: message.hideReason || null,
              createdAt: message.createdAt,
              conversationId: conversation._id
            };
          }
        }
      } catch (error) {
        console.error(`Error enriching message report ${report._id}:`, error);
      }

      return {
        ...report,
        messageDetails,
        reportId: report._id
      };
    }));

    console.log(`✅ Found ${total} message reports, returning ${enrichedReports.length}`);

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
    console.error('❌ Get all message reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message reports',
      error: error.message
    });
  }
};

// ========== UPDATE MESSAGE REPORT STATUS (Admin) ==========
exports.updateMessageReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNote } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    console.log(`📋 Updating message report ${reportId} to status: ${status}`);

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

    if (report.targetType !== 'message') {
      return res.status(400).json({
        success: false,
        message: 'This report is not for a message'
      });
    }

    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    report.reviewedAt = Date.now();
    report.reviewedBy = {
      userId: userId,
      userType: userType,
      name: req.user.name || req.user.username || 'Admin'
    };

    if (status === 'Resolved') {
      const conversation = await Message.findOne({ 'messages._id': report.targetId });
      if (conversation) {
        const message = conversation.messages.id(report.targetId);
        if (message && !message.isHidden) {
          message.isHidden = true;
          message.hiddenAt = new Date();
          message.hiddenBy = {
            userId: userId,
            userType: userType
          };
          message.hideReason = adminNote || 'Content violates community guidelines';
          await conversation.save();
        }
        report.actionTaken = 'hidden';
        report.actionDetails = 'Message hidden by admin';
      }
    } else if (status === 'Dismissed') {
      report.actionTaken = 'none';
      report.actionDetails = 'Report dismissed';
    }

    await report.save();

    console.log(`✅ Message report ${reportId} updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}`,
      data: {
        reportId: report._id,
        status: report.status,
        messageId: report.targetId,
        actionTaken: report.actionTaken
      }
    });
  } catch (error) {
    console.error('❌ Update message report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message report status',
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

    const { content, parentDoc, parentType } = await getContentByType(contentType, contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

    const { updated, contentInfo } = await updateContentHideStatus(
      contentType, contentId, true, userId, userType, reason
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to hide content'
      });
    }

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

    const { content } = await getContentByType(contentType, contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${contentType} not found`
      });
    }

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

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.targetType = type;
    }

    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich reports with content details AND reporter details
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      let contentDetails = {};
      let reporterDetails = {};
      
      // Get reporter details
      try {
        const reporterUser = await getUserDetails(report.reportedBy.userId);
        if (reporterUser) {
          reporterDetails = {
            userId: reporterUser.userId,
            name: reporterUser.name,
            email: reporterUser.email,
            avatar: reporterUser.avatar,
            userType: reporterUser.userType
          };
        } else {
          reporterDetails = {
            userId: report.reportedBy.userId,
            name: report.reportedBy.name || 'Unknown',
            avatar: null,
            userType: report.reportedBy.userType || 'User'
          };
        }
      } catch (error) {
        console.error(`Error fetching reporter details for report ${report._id}:`, error);
        reporterDetails = {
          userId: report.reportedBy.userId,
          name: report.reportedBy.name || 'Unknown',
          avatar: null,
          userType: report.reportedBy.userType || 'User'
        };
      }
      
      // Get content details
      try {
        const { content, parentDoc } = await getContentByType(
          report.targetType, 
          report.targetId
        );

        if (content) {
          if (report.targetType === 'post') {
            // Get author details
            let authorDetails = null;
            if (content.author?.userId) {
              authorDetails = await getUserDetails(content.author.userId);
            }
            
            contentDetails = {
              id: content._id,
              title: content.title || 'Untitled',
              content: content.content || '',
              author: authorDetails || {
                name: content.author?.name || 'Unknown',
                userId: content.author?.userId || null,
                userType: content.author?.userType || 'User',
                avatar: null
              },
              category: content.category,
              media: content.media || [],
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt,
              fullContent: content.content || ''
            };
          } else if (report.targetType === 'comment') {
            // Get author details
            let authorDetails = null;
            if (content.author?.userId) {
              authorDetails = await getUserDetails(content.author.userId);
            }
            
            contentDetails = {
              id: content._id,
              postId: parentDoc ? parentDoc._id : null,
              postTitle: parentDoc ? parentDoc.title || '' : '',
              content: content.content || '',
              author: authorDetails || {
                name: content.author?.name || 'Unknown',
                userId: content.author?.userId || null,
                userType: content.author?.userType || 'User',
                avatar: null
              },
              parentCommentId: content.parentCommentId || null,
              replyToUserName: content.replyToUserName || null,
              postAuthor: parentDoc ? parentDoc.author : null,
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt,
              fullContent: content.content || ''
            };
          } else if (report.targetType === 'message') {
            // Get sender details
            let senderDetails = null;
            if (content.senderId) {
              senderDetails = await getUserDetails(content.senderId);
            }
            
            const otherParticipant = parentDoc && parentDoc.participants ? 
              parentDoc.participants.find(
                p => p.userId && p.userId.toString() !== content.senderId.toString()
              ) : null;

            contentDetails = {
              id: content._id,
              conversationId: parentDoc ? parentDoc._id : null,
              content: content.content || '[Media/Call Message]',
              sender: senderDetails || {
                userId: content.senderId,
                userType: content.senderType,
                name: content.senderName || 'Unknown',
                avatar: null
              },
              receiver: otherParticipant ? {
                userId: otherParticipant.userId,
                userType: otherParticipant.userType,
                name: otherParticipant.name || 'Unknown',
                avatar: null
              } : null,
              media: content.media || [],
              callType: content.callType || 'none',
              callStatus: content.callStatus || 'none',
              isHidden: content.isHidden || false,
              hiddenAt: content.hiddenAt || null,
              hiddenBy: content.hiddenBy || null,
              hideReason: content.hideReason || null,
              createdAt: content.createdAt,
              fullContent: content.content || '[Media/Call Message]'
            };
          }
        }
      } catch (error) {
        console.error(`Error enriching report ${report._id}:`, error);
      }

      return {
        ...report,
        contentDetails,
        reporterDetails,
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

    const reports = await Report.find({}).lean();

    reports.forEach(report => {
      stats.total++;
      
      if (report.status === 'Pending') stats.pending++;
      else if (report.status === 'Reviewed') stats.reviewed++;
      else if (report.status === 'Resolved') stats.resolved++;
      else if (report.status === 'Dismissed') stats.dismissed++;
      
      if (report.targetType === 'post') stats.byType.post++;
      else if (report.targetType === 'comment') stats.byType.comment++;
      else if (report.targetType === 'message') stats.byType.message++;
      
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

    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    report.reviewedAt = Date.now();
    report.reviewedBy = {
      userId: userId,
      userType: userType,
      name: req.user.name || req.user.username || 'Admin'
    };

    if (status === 'Resolved' || status === 'Dismissed') {
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

      for (const post of posts) {
        let authorDetails = null;
        if (post.author?.userId) {
          authorDetails = await getUserDetails(post.author.userId);
        }
        
        hiddenContent.push({
          _id: post._id,
          type: 'post',
          title: post.title || '',
          content: post.content ? post.content.substring(0, 200) : '',
          fullContent: post.content || '',
          author: authorDetails || {
            name: post.author?.name || 'Unknown',
            userId: post.author?.userId || null,
            userType: post.author?.userType || 'User',
            avatar: null
          },
          category: post.category,
          media: post.media || [],
          hiddenAt: post.hiddenAt,
          hiddenBy: post.hiddenBy,
          hideReason: post.hideReason,
          createdAt: post.createdAt
        });
      }
    }

    // Get hidden comments
    if (type === 'comment' || !type) {
      const posts = await ForumPost.find({ 'comments.isHidden': true })
        .select('title content author comments')
        .lean();

      for (const post of posts) {
        if (post.comments) {
          for (const comment of post.comments) {
            if (comment.isHidden) {
              let authorDetails = null;
              if (comment.author?.userId) {
                authorDetails = await getUserDetails(comment.author.userId);
              }
              
              hiddenContent.push({
                _id: comment._id,
                postId: post._id,
                postTitle: post.title || '',
                type: 'comment',
                content: comment.content ? comment.content.substring(0, 200) : '',
                fullContent: comment.content || '',
                author: authorDetails || {
                  name: comment.author?.name || 'Unknown',
                  userId: comment.author?.userId || null,
                  userType: comment.author?.userType || 'User',
                  avatar: null
                },
                parentCommentId: comment.parentCommentId || null,
                replyToUserName: comment.replyToUserName || null,
                hiddenAt: comment.hiddenAt,
                hiddenBy: comment.hiddenBy,
                hideReason: comment.hideReason,
                createdAt: comment.createdAt
              });
            }
          }
        }
      }
    }

    // Get hidden messages
    if (type === 'message' || !type) {
      const conversations = await Message.find({ 'messages.isHidden': true })
        .select('participants messages')
        .lean();

      for (const conversation of conversations) {
        if (conversation.messages) {
          for (const msg of conversation.messages) {
            if (msg.isHidden) {
              let senderDetails = null;
              if (msg.senderId) {
                senderDetails = await getUserDetails(msg.senderId);
              }
              
              const otherParticipant = conversation.participants ? 
                conversation.participants.find(
                  p => p.userId && p.userId.toString() !== msg.senderId.toString()
                ) : null;

              hiddenContent.push({
                _id: msg._id,
                conversationId: conversation._id,
                type: 'message',
                content: msg.content ? msg.content.substring(0, 200) : '[Media/Call Message]',
                fullContent: msg.content || '[Media/Call Message]',
                sender: senderDetails || {
                  userId: msg.senderId,
                  userType: msg.senderType,
                  name: msg.senderName || 'Unknown',
                  avatar: null
                },
                receiver: otherParticipant ? {
                  userId: otherParticipant.userId,
                  userType: otherParticipant.userType,
                  name: otherParticipant.name || 'Unknown',
                  avatar: null
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
          }
        }
      }
    }

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