// Mapa-Milihan/backend/controllers/Message.js
const { Message } = require('../models/Message');
const { uploadToCloudinary } = require('../utils/cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');
const os = require('os');
const path = require('path');

// WebSocket server instance
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

// Helper: Check if ID is valid ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper: Get ID string from object or string
const getIdString = (id) => {
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id._id) return id._id.toString();
  if (typeof id === 'object' && id.toString) return id.toString();
  return null;
};

// ========== SEND MESSAGE ==========
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, receiverName, content, replyToMessageId, callType, callStatus, callDuration } = req.body;
    const senderId = req.user.id;
    
    const senderType = getUserTypeFromRole(req.user);
    const senderName = req.user.name || req.user.username || 'User';

    console.log(`📨 Sending message from ${senderId} to ${receiverId}`);
    console.log(`📨 Sender type: ${senderType}, Receiver type: ${receiverType}`);

    if (!receiverId || !receiverType) {
      console.log('❌ Missing receiverId or receiverType');
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and type are required'
      });
    }

    // Normalize receiverType to proper case
    const validTypes = ['User', 'Farmer', 'Admin'];
    let normalizedReceiverType = receiverType;
    
    // Check if receiverType is valid (case insensitive)
    const foundType = validTypes.find(t => t.toLowerCase() === receiverType.toLowerCase());
    if (foundType) {
      normalizedReceiverType = foundType;
      console.log(`📨 Normalized receiverType from "${receiverType}" to "${normalizedReceiverType}"`);
    } else if (!validTypes.includes(receiverType)) {
      console.log(`❌ Invalid receiverType: ${receiverType}`);
      return res.status(400).json({
        success: false,
        message: `Invalid receiverType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const finalReceiverType = normalizedReceiverType;

    // Check if user is blocked
    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: senderId, userType: senderType } },
          { $elemMatch: { userId: receiverId, userType: finalReceiverType } }
        ]
      }
    });

    if (conversation) {
      // Check if receiver has blocked sender
      const receiverParticipant = conversation.participants.find(p => {
        const pUserId = getIdString(p.userId);
        return pUserId === receiverId.toString();
      });
      
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
      console.log(`📤 Processing ${files.length} files`);
      const uploadedFiles = await uploadFilesToCloudinary(files, 'mapa-milihan/messages');
      if (uploadedFiles && uploadedFiles.length > 0) {
        mediaUrls = uploadedFiles;
      }
    }

    if (!conversation) {
      console.log(`📨 Creating new conversation between ${senderId} and ${receiverId}`);
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
            userType: finalReceiverType,
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
      senderId: senderId,
      senderType: senderType,
      senderName: senderName,
      content: content || '',
      media: mediaUrls,
      isRead: false,
      replyTo: replyTo,
      callType: callType || 'none',
      callStatus: callStatus || 'none',
      callDuration: callDuration || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`📨 Adding message to conversation`);

    conversation.messages.push(message);
    conversation.lastMessageAt = new Date();
    
    await conversation.save();
    console.log(`✅ Message saved with ID: ${message._id}`);

    // Populate the conversation with user details for response
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
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedConversation
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    console.error('Error stack:', error.stack);
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

    console.log(`📨 Fetching conversations for user: ${userId}, type: ${userType}`);

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

    console.log(`📨 Found ${conversations.length} conversations`);

    const processedConversations = conversations.map(conv => {
      try {
        // Get unread count for this user
        const unreadCount = conv.messages ? conv.messages.filter(msg => {
          const msgSenderId = getIdString(msg.senderId);
          return msgSenderId && msgSenderId !== userId.toString() && !msg.isRead;
        }).length : 0;

        // Get last message
        const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

        // Get other participant
        let otherParticipant = null;
        for (const p of conv.participants || []) {
          const pUserId = getIdString(p.userId);
          if (pUserId && pUserId !== userId.toString()) {
            otherParticipant = {
              userId: {
                _id: pUserId,
                name: p.userId?.name || p.name || 'User',
                email: p.userId?.email || null,
                avatar: p.userId?.avatar || p.avatar || null
              },
              userType: p.userType,
              name: p.name || 'User',
              avatar: p.avatar || null,
              isBlocked: p.isBlocked || false
            };
            break;
          }
        }

        // Check if user is blocked
        let isBlocked = false;
        for (const p of conv.participants || []) {
          const pUserId = getIdString(p.userId);
          if (pUserId === userId.toString()) {
            isBlocked = p.isBlocked || false;
            break;
          }
        }

        return {
          _id: conv._id,
          participants: conv.participants || [],
          messages: conv.messages || [],
          lastMessageAt: conv.lastMessageAt || new Date(),
          lastMessage,
          unreadCount,
          otherParticipant,
          isBlocked,
          createdAt: conv.createdAt || new Date(),
          updatedAt: conv.updatedAt || new Date()
        };
      } catch (err) {
        console.error('Error processing conversation:', err, conv._id);
        return {
          _id: conv._id,
          participants: conv.participants || [],
          messages: [],
          lastMessageAt: conv.lastMessageAt || new Date(),
          unreadCount: 0,
          otherParticipant: null,
          isBlocked: false,
          error: true
        };
      }
    });

    console.log(`✅ Successfully processed ${processedConversations.length} conversations`);

    res.status(200).json({
      success: true,
      data: processedConversations
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    console.error('Error stack:', error.stack);
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

    console.log(`📨 Fetching messages for conversation: ${conversationId} for user: ${userId}`);

    if (!isValidObjectId(conversationId)) {
      console.log(`❌ Invalid conversation ID format: ${conversationId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      console.log(`❌ Conversation not found: ${conversationId}`);
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    console.log(`📨 Found conversation with ${conversation.messages.length} messages`);

    // Check if user is a participant
    let isParticipant = false;
    let userIsBlocked = false;
    
    for (const p of conversation.participants) {
      const pUserId = getIdString(p.userId);
      if (pUserId === userId.toString()) {
        isParticipant = true;
        userIsBlocked = p.isBlocked || false;
        break;
      }
    }

    if (!isParticipant) {
      console.log(`❌ User ${userId} is not a participant in conversation ${conversationId}`);
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    if (userIsBlocked) {
      console.log(`❌ User ${userId} is blocked in conversation ${conversationId}`);
      return res.status(403).json({
        success: false,
        message: 'You are blocked in this conversation'
      });
    }

    // Get messages
    let messages = conversation.messages || [];
    
    if (before) {
      const beforeIndex = messages.findIndex(m => {
        const mId = getIdString(m._id);
        return mId === before;
      });
      if (beforeIndex > -1) {
        messages = messages.slice(0, beforeIndex);
      }
    }

    // Filter out messages deleted for this user
    messages = messages.filter(msg => {
      if (!msg.deletedFor || msg.deletedFor.length === 0) return true;
      const isDeletedForUser = msg.deletedFor.some(d => {
        const dUserId = getIdString(d.userId);
        return dUserId === userId.toString();
      });
      return !isDeletedForUser;
    });

    const totalMessages = messages.length;
    messages = messages.slice(-limit);

    console.log(`📨 Returning ${messages.length} messages (filtered from ${totalMessages})`);

    // Mark messages as read
    let markedCount = 0;
    const readMessageIds = [];
    
    messages.forEach(msg => {
      const msgSenderId = getIdString(msg.senderId);
      
      if (msgSenderId && 
          msgSenderId !== userId.toString() && 
          !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
        markedCount++;
        readMessageIds.push(msg._id.toString());
      }
    });

    if (markedCount > 0) {
      await conversation.save();
      console.log(`📨 Marked ${markedCount} messages as read`);
    }

    // Get populated conversation for response
    const populatedConversation = await Message.findById(conversationId)
      .populate('participants.userId', 'name email avatar')
      .lean()
      .catch(err => {
        console.error('Error populating conversation:', err);
        return conversation.toObject();
      });

    // Send read receipts via WebSocket
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
        conversation: populatedConversation || conversation,
        messages: messages,
        markedAsRead: markedCount,
        hasMore: totalMessages > messages.length
      }
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    console.error('Error stack:', error.stack);
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

    console.log(`🗑️ Deleting message ${messageId} from conversation ${conversationId}`);

    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
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

    const msgSenderId = getIdString(message.senderId);
    const isSender = msgSenderId === userId.toString();

    if (deleteForEveryone) {
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages for everyone'
        });
      }
      message.deleteOne();
    } else {
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      const alreadyDeleted = message.deletedFor.some(d => {
        const dUserId = getIdString(d.userId);
        return dUserId === userId.toString();
      });
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

    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
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

    if (!message.reactions) {
      message.reactions = [];
    }

    const existingReaction = message.reactions.find(
      r => getIdString(r.userId) === userId.toString()
    );

    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        message.reactions = message.reactions.filter(
          r => getIdString(r.userId) !== userId.toString()
        );
      } else {
        existingReaction.reaction = reaction;
        existingReaction.createdAt = Date.now();
      }
    } else {
      message.reactions.push({
        userId: userId,
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

    console.log(`🔒 Blocking user ${blockUserId} by ${userId}`);

    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId, userType: userType } },
          { $elemMatch: { userId: blockUserId, userType: blockUserType } }
        ]
      }
    });

    if (!conversation) {
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

    const participantToBlock = conversation.participants.find(p => {
      const pUserId = getIdString(p.userId);
      return pUserId === blockUserId.toString();
    });

    if (participantToBlock) {
      participantToBlock.isBlocked = true;
    }

    if (!conversation.blockedBy) {
      conversation.blockedBy = [];
    }

    const alreadyBlocked = conversation.blockedBy.some(b => {
      const bUserId = getIdString(b.userId);
      return bUserId === userId.toString();
    });

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

    console.log(`🔓 Unblocking user ${unblockUserId} by ${userId}`);

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

    const participant = conversation.participants.find(p => {
      const pUserId = getIdString(p.userId);
      return pUserId === unblockUserId.toString();
    });

    if (participant) {
      participant.isBlocked = false;
    }

    if (conversation.blockedBy) {
      conversation.blockedBy = conversation.blockedBy.filter(b => {
        const bUserId = getIdString(b.userId);
        return bUserId !== userId.toString();
      });
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

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

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
      const msgSenderId = getIdString(msg.senderId);
      if (msgSenderId && msgSenderId !== userId.toString() && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = Date.now();
        updatedCount++;
        readMessageIds.push(msg._id.toString());
      }
    });

    await conversation.save();

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

    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
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

    if (!message.reports) {
      message.reports = [];
    }

    const alreadyReported = message.reports.some(
      r => getIdString(r.reportedBy?.userId) === userId.toString()
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
      const unreadCount = conv.messages.filter(msg => {
        const msgSenderId = getIdString(msg.senderId);
        return msgSenderId && msgSenderId !== userId.toString() && !msg.isRead;
      }).length;
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

// ========== SEND CALL MESSAGE ==========
exports.sendCallMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, receiverName, callType, callStatus, callDuration } = req.body;
    const senderId = req.user.id;
    
    const senderType = getUserTypeFromRole(req.user);
    const senderName = req.user.name || req.user.username || 'User';

    console.log(`📞 Sending call message from ${senderId} to ${receiverId}`);
    console.log(`📞 Call type: ${callType}, Status: ${callStatus}`);

    if (!receiverId || !receiverType) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and type are required'
      });
    }

    const validTypes = ['User', 'Farmer', 'Admin'];
    let normalizedReceiverType = receiverType;
    const foundType = validTypes.find(t => t.toLowerCase() === receiverType.toLowerCase());
    if (foundType) {
      normalizedReceiverType = foundType;
    }

    const finalReceiverType = normalizedReceiverType;

    // Find or create conversation
    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: senderId, userType: senderType } },
          { $elemMatch: { userId: receiverId, userType: finalReceiverType } }
        ]
      }
    });

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
            userType: finalReceiverType,
            name: receiverName || 'User',
            avatar: null
          }
        ],
        messages: [],
        lastMessageAt: Date.now()
      });
    }

    // Create call message
    const message = {
      senderId: senderId,
      senderType: senderType,
      senderName: senderName,
      content: '',
      media: [],
      isRead: false,
      replyTo: null,
      callType: callType || 'audio',
      callStatus: callStatus || 'missed',
      callDuration: callDuration || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = new Date();
    
    await conversation.save();
    console.log(`✅ Call message saved with ID: ${message._id}`);

    const populatedConversation = await Message.findById(conversation._id)
      .populate('participants.userId', 'name email avatar')
      .lean();

    const sentMessage = populatedConversation.messages[populatedConversation.messages.length - 1];

    // Send real-time notification via WebSocket
    if (wsServer) {
      try {
        wsServer.notifyNewMessage(conversation._id.toString(), sentMessage);
        console.log(`📨 WebSocket notification sent for call message ${sentMessage._id}`);
      } catch (wsError) {
        console.error('❌ Error sending WebSocket notification:', wsError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Call message sent successfully',
      data: populatedConversation
    });
  } catch (error) {
    console.error('❌ Send call message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending call message',
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
            p => getIdString(p.userId?._id) !== userId.toString()
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

// ========== GET OR CREATE CONVERSATION ==========
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { targetUserId, targetUserType, targetUserName } = req.body;
    const userId = req.user.id;
    const userType = getUserTypeFromRole(req.user);
    const userName = req.user.name || req.user.username || 'User';

    console.log(`📨 Getting or creating conversation between ${userId} (${userType}) and ${targetUserId} (${targetUserType})`);

    if (!targetUserId || !targetUserType) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID and type are required'
      });
    }

    // Check if trying to message yourself
    if (targetUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot message yourself'
      });
    }

    // Normalize targetUserType
    const validTypes = ['User', 'Farmer', 'Admin'];
    let normalizedTargetType = targetUserType;
    const foundType = validTypes.find(t => t.toLowerCase() === targetUserType.toLowerCase());
    if (foundType) {
      normalizedTargetType = foundType;
    }

    // Get target user details if not provided or incomplete
    let targetName = targetUserName || 'User';
    let targetAvatar = null;
    
    try {
      const User = mongoose.model('User');
      const targetUser = await User.findById(targetUserId).select('name avatar userType role');
      if (targetUser) {
        targetName = targetUser.name || targetUserName || 'User';
        targetAvatar = targetUser.avatar?.url || null;
        // Use the user's actual role/type if available
        if (targetUser.userType && validTypes.includes(targetUser.userType)) {
          normalizedTargetType = targetUser.userType;
        } else if (targetUser.role) {
          // Map role to userType
          if (targetUser.role === 'farmer') normalizedTargetType = 'Farmer';
          else if (targetUser.role === 'admin') normalizedTargetType = 'Admin';
          else normalizedTargetType = 'User';
        }
        console.log(`📨 Target user found: ${targetName} (${normalizedTargetType})`);
      } else {
        console.log(`⚠️ Target user not found in database: ${targetUserId}`);
      }
    } catch (err) {
      console.log('Could not fetch target user details, using provided values:', err.message);
    }

    // Find existing conversation - IMPORTANT: Use the normalized types
    let conversation = await Message.findOne({
      participants: {
        $all: [
          { $elemMatch: { userId: userId, userType: userType } },
          { $elemMatch: { userId: targetUserId, userType: normalizedTargetType } }
        ]
      }
    });

    if (!conversation) {
      console.log(`📨 Creating new conversation between ${userId} and ${targetUserId}`);
      
      // Create a new conversation with proper participant data
      const newConversation = new Message({
        participants: [
          {
            userId: userId,
            userType: userType,
            name: userName,
            avatar: req.user.avatar?.url || null
          },
          {
            userId: targetUserId,
            userType: normalizedTargetType,
            name: targetName,
            avatar: targetAvatar
          }
        ],
        messages: [],
        lastMessageAt: Date.now()
      });

      conversation = await newConversation.save();
      console.log(`✅ New conversation created with ID: ${conversation._id}`);
    } else {
      console.log(`✅ Existing conversation found with ID: ${conversation._id}`);
    }

    // Populate and return the conversation
    const populatedConversation = await Message.findById(conversation._id)
      .populate('participants.userId', 'name email avatar')
      .lean();

    if (!populatedConversation) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving conversation'
      });
    }

    // Process conversation for response
    const processedConv = {
      _id: populatedConversation._id,
      participants: populatedConversation.participants,
      messages: populatedConversation.messages || [],
      lastMessageAt: populatedConversation.lastMessageAt || new Date(),
      lastMessage: populatedConversation.messages && populatedConversation.messages.length > 0 
        ? populatedConversation.messages[populatedConversation.messages.length - 1] 
        : null,
      unreadCount: populatedConversation.messages ? populatedConversation.messages.filter(msg => {
        const msgSenderId = getIdString(msg.senderId);
        return msgSenderId && msgSenderId !== userId.toString() && !msg.isRead;
      }).length : 0,
      otherParticipant: null,
      isBlocked: false,
      createdAt: populatedConversation.createdAt || new Date(),
      updatedAt: populatedConversation.updatedAt || new Date()
    };

    // Get other participant
    for (const p of populatedConversation.participants) {
      const pUserId = getIdString(p.userId);
      if (pUserId && pUserId !== userId.toString()) {
        processedConv.otherParticipant = {
          userId: {
            _id: pUserId,
            name: p.userId?.name || p.name || 'User',
            email: p.userId?.email || null,
            avatar: p.userId?.avatar || p.avatar || null
          },
          userType: p.userType,
          name: p.name || 'User',
          avatar: p.avatar || null,
          isBlocked: p.isBlocked || false
        };
        break;
      }
    }

    // Check if user is blocked
    for (const p of populatedConversation.participants) {
      const pUserId = getIdString(p.userId);
      if (pUserId === userId.toString()) {
        processedConv.isBlocked = p.isBlocked || false;
        break;
      }
    }

    console.log(`📨 Returning conversation with ID: ${processedConv._id}`);

    res.status(200).json({
      success: true,
      data: processedConv
    });
  } catch (error) {
    console.error('❌ Get or create conversation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error getting or creating conversation',
      error: error.message
    });
  }
};