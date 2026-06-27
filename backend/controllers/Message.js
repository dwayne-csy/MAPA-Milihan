const { Message } = require('../models/Message');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const fs = require('fs');
const os = require('os');
const path = require('path');

// WebSocket server instance (will be set from server.js)
let wsServer = null;

// Function to set WebSocket server instance
exports.setWebSocketServer = (server) => {
  wsServer = server;
  console.log('✅ WebSocket server instance set in Message controller');
};


// Helper: Upload files to Cloudinary
const uploadFilesToCloudinary = async (files, folder = 'Mapa-Milihan/messages') => {
  if (!files || files.length === 0) return [];
  
  console.log(`📤 Starting upload of ${files.length} files to Cloudinary folder: ${folder}`);
  
  const concurrencyLimit = 3;
  const results = [];
  
  for (let i = 0; i < files.length; i += concurrencyLimit) {
    const chunk = files.slice(i, i + concurrencyLimit);
    const chunkPromises = chunk.map(async (file) => {
      let tempFilePath = null;
      try {
        let fileBuffer;
        
        if (file.path) {
          fileBuffer = fs.readFileSync(file.path);
        } else if (file.buffer) {
          fileBuffer = file.buffer;
        } else {
          throw new Error('No file data available');
        }
        
        const tempDir = path.join(os.tmpdir(), 'mapa_milihan_temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname) || '.jpg';
        tempFilePath = path.join(tempDir, `message-${timestamp}-${random}${ext}`);
        
        fs.writeFileSync(tempFilePath, fileBuffer);
        
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');
        const isAudio = file.mimetype && file.mimetype.startsWith('audio/');
        const isDocument = file.mimetype && (
          file.mimetype.includes('pdf') || 
          file.mimetype.includes('document') ||
          file.mimetype.includes('text') ||
          file.mimetype.includes('spreadsheet')
        );
        
        let resourceType = 'image';
        let mediaType = 'image';
        
        if (isVideo) {
          resourceType = 'video';
          mediaType = 'video';
        } else if (isAudio) {
          resourceType = 'raw';
          mediaType = 'audio';
        } else if (isDocument) {
          resourceType = 'raw';
          mediaType = 'document';
        }
        
        const result = await uploadToCloudinary(tempFilePath, folder, resourceType);
        
        return {
          url: result.url,
          publicId: result.public_id,
          type: mediaType,
          mimetype: file.mimetype,
          size: file.size || fileBuffer.length,
          fileName: file.originalname,
          duration: file.duration || null
        };
      } catch (error) {
        console.error('❌ Error uploading to Cloudinary:', error);
        return null;
      } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
          }
        }
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
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

// Helper: Get user type from role
const getUserTypeFromRole = (user) => {
  if (user.role === 'farmer') return 'Farmer';
  if (user.role === 'admin') return 'Admin';
  if (user.userType) return user.userType;
  return 'User';
};

// ========== SEND MESSAGE ==========
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, receiverName, content, replyToMessageId, callType, callStatus, callDuration } = req.body;
    const senderId = req.user.id;
    
    const senderType = getUserTypeFromRole(req.user);
    const senderName = req.user.name || req.user.username || 'User';

    if (!receiverId || !receiverType) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and type are required'
      });
    }

    // Check if user is blocked
    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: senderId, userType: senderType } },
          { $elemMatch: { userId: receiverId, userType: receiverType } }
        ]
      }
    });

    if (conversation) {
      // Check if receiver has blocked sender
      const receiverParticipant = conversation.participants.find(
        p => p.userId.toString() === receiverId.toString()
      );
      
      if (receiverParticipant && receiverParticipant.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'You are blocked by this user'
        });
      }
    }

    const files = req.files || [];
    let mediaUrls = [];

    if (files && files.length > 0) {
      const uploadedFiles = await uploadFilesToCloudinary(files, 'mapa-milihan/messages');
      if (uploadedFiles && uploadedFiles.length > 0) {
        mediaUrls = uploadedFiles;
      }
    }

    if (!conversation) {
      conversation = new Message({
        participants: [
          {
            userId: senderId,
            userType: senderType,
            name: senderName,
            avatar: req.user.avatar?.url || null
          },
          {
            userId: receiverId,
            userType: receiverType,
            name: receiverName || 'User',
            avatar: null
          }
        ],
        messages: [],
        lastMessageAt: Date.now()
      });
    }

    let replyTo = null;
    if (replyToMessageId) {
      const replyMessage = conversation.messages.id(replyToMessageId);
      if (replyMessage) {
        replyTo = {
          messageId: replyMessage._id,
          content: replyMessage.content,
          senderName: replyMessage.senderName,
          media: replyMessage.media
        };
      }
    }

    const message = {
      senderId,
      senderType,
      senderName,
      content: content || '',
      media: mediaUrls,
      isRead: false,
      replyTo,
      callType: callType || 'none',
      callStatus: callStatus || 'none',
      callDuration: callDuration || 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    // Populate the conversation with user details
    const populatedConversation = await Message.findById(conversation._id)
      .populate('participants.userId', 'name email avatar')
      .lean();

    // Get the last message (the one we just sent)
    const sentMessage = populatedConversation.messages[populatedConversation.messages.length - 1];

    // 🔥 Send real-time notification via WebSocket
    if (wsServer) {
    try {
        wsServer.notifyNewMessage(conversation._id.toString(), sentMessage);
        console.log(`📨 WebSocket notification sent for message ${sentMessage._id}`);
    } catch (wsError) {
        console.error('❌ Error sending WebSocket notification:', wsError);
    }
    } else {
    console.log('⚠️ WebSocket server not available, skipping real-time notification');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedConversation
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
    const userType = getUserTypeFromRole(req.user);

    const conversations = await Message.find({
      'participants': {
        $elemMatch: {
          userId: userId,
          userType: userType
        }
      }
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants.userId', 'name email avatar')
      .lean();

    // Process conversations
    const processedConversations = conversations.map(conv => {
      // Get unread count for this user
      const unreadCount = conv.messages.filter(msg => 
        msg.senderId && 
        msg.senderId.toString() !== userId.toString() && 
        !msg.isRead
      ).length;

      // Get last message
      const lastMessage = conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

      // Get other participant
      const otherParticipant = conv.participants.find(
        p => p.userId && p.userId._id && p.userId._id.toString() !== userId.toString()
      );

      // Check if user is blocked
      const isBlocked = conv.participants.some(
        p => p.userId && p.userId._id && 
        p.userId._id.toString() === userId.toString() && 
        p.isBlocked
      );

      return {
        ...conv,
        unreadCount,
        lastMessage,
        otherParticipant: otherParticipant || null,
        isBlocked
      };
    });

    res.status(200).json({
      success: true,
      data: processedConversations
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
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    const conversation = await Message.findById(conversationId)
      .populate('participants.userId', 'name email avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(p => 
      p.userId && p.userId._id && p.userId._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Check if user is blocked
    const userParticipant = conversation.participants.find(
      p => p.userId && p.userId._id && p.userId._id.toString() === userId.toString()
    );
    
    if (userParticipant && userParticipant.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'You are blocked in this conversation'
      });
    }

    // Query messages
    let messages = conversation.messages;
    
    if (before) {
      const beforeIndex = messages.findIndex(m => m._id.toString() === before);
      if (beforeIndex > -1) {
        messages = messages.slice(0, beforeIndex);
      }
    }

    // Filter out messages deleted for this user
    messages = messages.filter(msg => {
      if (!msg.deletedFor) return true;
      return !msg.deletedFor.some(d => d.userId && d.userId.toString() === userId.toString());
    });

    messages = messages.slice(-limit);

    // Mark messages as read
    let markedCount = 0;
    const readMessageIds = [];
    
    messages.forEach(msg => {
      if (msg.senderId && 
          msg.senderId.toString() !== userId.toString() && 
          !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
        markedCount++;
        readMessageIds.push(msg._id.toString());
      }
    });

    await conversation.save();

    // 🔥 Send read receipts via WebSocket
    if (wsServer && readMessageIds.length > 0) {
      try {
        readMessageIds.forEach(messageId => {
          wsServer.notifyReadReceipt(conversationId, messageId, userId);
        });
        console.log(`👁️ Read receipts sent for ${readMessageIds.length} messages`);
      } catch (wsError) {
        console.error('❌ Error sending read receipts:', wsError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: messages,
        markedAsRead: markedCount,
        hasMore: conversation.messages.length > messages.length
      }
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

// ========== DELETE MESSAGE ==========
exports.deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user.id;

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

    // Check if user is the sender
    const isSender = message.senderId.toString() === userId.toString();

    if (deleteForEveryone) {
      // Only sender can delete for everyone
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages for everyone'
        });
      }
      
      // Delete message completely
      message.deleteOne();
    } else {
      // Delete for me only
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      // Check if already deleted for this user
      const alreadyDeleted = message.deletedFor.some(
        d => d.userId && d.userId.toString() === userId.toString()
      );
      if (!alreadyDeleted) {
        message.deletedFor.push({
          userId: userId,
          deletedAt: Date.now()
        });
      }
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// ========== ADD REACTION ==========
exports.addReaction = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user.id;

    if (!reaction) {
      return res.status(400).json({
        success: false,
        message: 'Reaction is required'
      });
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

    // Check if user already reacted
    if (!message.reactions) {
      message.reactions = [];
    }

    const existingReaction = message.reactions.find(
      r => r.userId && r.userId.toString() === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        // Remove reaction if same
        message.reactions = message.reactions.filter(
          r => r.userId.toString() !== userId.toString()
        );
      } else {
        // Update reaction
        existingReaction.reaction = reaction;
        existingReaction.createdAt = Date.now();
      }
    } else {
      // Add new reaction
      message.reactions.push({
        userId,
        reaction,
        createdAt: Date.now()
      });
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Reaction updated successfully',
      data: message.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

// ========== BLOCK USER ==========
exports.blockUser = async (req, res) => {
  try {
    const { userId: blockUserId, userType: blockUserType } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    if (!blockUserId || !blockUserType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and type are required to block'
      });
    }

    // Find conversation
    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId, userType: userType } },
          { $elemMatch: { userId: blockUserId, userType: blockUserType } }
        ]
      }
    });

    if (!conversation) {
      // Create a new conversation if it doesn't exist
      conversation = new Message({
        participants: [
          {
            userId: userId,
            userType: userType,
            name: req.user.name || req.user.username || 'User'
          },
          {
            userId: blockUserId,
            userType: blockUserType,
            name: 'Blocked User'
          }
        ],
        messages: []
      });
    }

    // Update participant status
    const participantToBlock = conversation.participants.find(
      p => p.userId.toString() === blockUserId.toString()
    );

    if (participantToBlock) {
      participantToBlock.isBlocked = true;
    }

    // Add to blockedBy list
    if (!conversation.blockedBy) {
      conversation.blockedBy = [];
    }

    // Check if already blocked
    const alreadyBlocked = conversation.blockedBy.some(
      b => b.userId && b.userId.toString() === userId.toString()
    );

    if (!alreadyBlocked) {
      conversation.blockedBy.push({
        userId: userId,
        userType: userType,
        blockedAt: Date.now(),
        reason: req.body.reason || ''
      });
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: error.message
    });
  }
};

// ========== UNBLOCK USER ==========
exports.unblockUser = async (req, res) => {
  try {
    const { userId: unblockUserId, userType: unblockUserType } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    const conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId, userType: userType } },
          { $elemMatch: { userId: unblockUserId, userType: unblockUserType } }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Update participant status
    const participant = conversation.participants.find(
      p => p.userId.toString() === unblockUserId.toString()
    );

    if (participant) {
      participant.isBlocked = false;
    }

    // Remove from blockedBy
    if (conversation.blockedBy) {
      conversation.blockedBy = conversation.blockedBy.filter(
        b => b.userId && b.userId.toString() !== userId.toString()
      );
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: error.message
    });
  }
};

// ========== MARK MESSAGES AS READ ==========
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    let updatedCount = 0;
    const readMessageIds = [];

    conversation.messages.forEach(msg => {
      if (msg.senderId && msg.senderId.toString() !== userId.toString() && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
        updatedCount++;
        readMessageIds.push(msg._id.toString());
      }
    });

    await conversation.save();

    // 🔥 Send read receipts via WebSocket
    if (wsServer && readMessageIds.length > 0) {
      try {
        readMessageIds.forEach(messageId => {
          wsServer.notifyReadReceipt(conversationId, messageId, userId);
        });
        console.log(`👁️ Read receipts sent for ${readMessageIds.length} messages from markAsRead`);
      } catch (wsError) {
        console.error('❌ Error sending read receipts:', wsError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: { markedCount: updatedCount }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};

// ========== REPORT MESSAGE ==========
exports.reportMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
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

    // Check if already reported by this user
    if (!message.reports) {
      message.reports = [];
    }

    const alreadyReported = message.reports.some(
      r => r.reportedBy && r.reportedBy.userId && r.reportedBy.userId.toString() === userId.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this message'
      });
    }

    message.reports.push({
      reportedBy: {
        userId,
        userType
      },
      reason,
      description: description || '',
      status: 'Pending',
      createdAt: Date.now()
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message reported successfully'
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

// ========== GET UNREAD COUNT ==========
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);

    const conversations = await Message.find({
      'participants': {
        $elemMatch: {
          userId: userId,
          userType: userType
        }
      }
    });

    let totalUnread = 0;
    const unreadDetails = conversations.map(conv => {
      const unreadCount = conv.messages.filter(msg => 
        msg.senderId && msg.senderId.toString() !== userId.toString() && !msg.isRead
      ).length;
      totalUnread += unreadCount;
      return {
        conversationId: conv._id,
        unreadCount
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        conversations: unreadDetails
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
};

// ========== GET CALL HISTORY ==========
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const conversations = await Message.find({
      'participants.userId': userId
    })
      .populate('participants.userId', 'name email avatar')
      .lean();

    const callHistory = [];
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.callType && msg.callType !== 'none') {
          const otherParticipant = conv.participants.find(
            p => p.userId && p.userId._id && p.userId._id.toString() !== userId.toString()
          );
          callHistory.push({
            conversationId: conv._id,
            messageId: msg._id,
            callType: msg.callType,
            callStatus: msg.callStatus,
            callDuration: msg.callDuration,
            createdAt: msg.createdAt,
            otherParticipant: otherParticipant || null
          });
        }
      });
    });

    callHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: callHistory.slice(0, limit)
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching call history',
      error: error.message
    });
  }
};