const mongoose = require('mongoose');

// Message Schema
const messageSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['User', 'Farmer', 'Admin']
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: null
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  }],
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    senderType: {
      type: String,
      required: true,
      enum: ['User', 'Farmer', 'Admin']
    },
    senderName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    media: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true
      },
      thumbnail: {
        type: String
      },
      duration: {
        type: Number // For audio/video duration in seconds
      },
      size: {
        type: Number
      },
      fileName: {
        type: String
      },
      mimetype: {
        type: String
      }
    }],
    // Call-related fields
    callType: {
      type: String,
      enum: ['audio', 'video', 'none'],
      default: 'none'
    },
    callDuration: {
      type: Number,
      default: 0
    },
    callStatus: {
      type: String,
      enum: ['missed', 'answered', 'rejected', 'cancelled', 'ongoing', 'none'],
      default: 'none'
    },
    // Read receipt
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    // Delete functionality
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId
      },
      deletedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Reply to message
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId
      },
      content: {
        type: String
      },
      senderName: {
        type: String
      },
      media: [{
        url: String,
        type: String
      }]
    },
    // Reactions (like Instagram)
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      reaction: {
        type: String,
        enum: ['❤️', '😂', '😮', '😢', '🙏', '👍', '👎', '🔥', '⭐'],
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Reports
    reports: [{
      reportedBy: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'messages.reports.reportedBy.userType'
        },
        userType: {
          type: String,
          required: true,
          enum: ['User', 'Farmer', 'Admin']
        }
      },
      reason: {
        type: String,
        required: true,
        enum: ['Spam', 'Harassment', 'Inappropriate Content', 'False Information', 'Other']
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
        default: 'Pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Last message tracking
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: {
      type: String
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId
    },
    senderName: {
      type: String
    },
    createdAt: {
      type: Date
    },
    mediaType: {
      type: String
    },
    callType: {
      type: String
    },
    callStatus: {
      type: String
    }
  },
  // Block list
  blockedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId
    },
    userType: {
      type: String,
      enum: ['User', 'Farmer', 'Admin']
    },
    blockedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ===================== INDEXES =====================

// For finding conversations by participants
messageSchema.index({ 'participants.userId': 1, 'participants.userType': 1 });

// For sorting by last message
messageSchema.index({ lastMessageAt: -1 });

// For message reports
messageSchema.index({ 'messages.reports.status': 1 });

// For filtering messages by date
messageSchema.index({ 'messages.createdAt': -1 });

// For blocked participants
messageSchema.index({ 'participants.isBlocked': 1 });

// For blocked by
messageSchema.index({ 'blockedBy.userId': 1 });

// ===================== VIRTUALS =====================

// Virtual for unread count
messageSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

// ===================== METHODS =====================

// Check if user is blocked
messageSchema.methods.isUserBlocked = function(userId) {
  return this.blockedBy.some(block => block.userId.toString() === userId.toString());
};

// Check if user is a participant
messageSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

// Get unread messages count for a specific user
messageSchema.methods.getUnreadCountForUser = function(userId) {
  return this.messages.filter(msg => 
    msg.senderId.toString() !== userId.toString() && !msg.isRead
  ).length;
};

// Get last message
messageSchema.methods.getLastMessage = function() {
  if (this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
};

// Get other participant
messageSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.userId.toString() !== userId.toString());
};

// Check if user has blocked the other participant
messageSchema.methods.hasBlocked = function(userId) {
  const user = this.participants.find(p => p.userId.toString() === userId.toString());
  return user ? user.isBlocked : false;
};

// Mark all messages as read for a user
messageSchema.methods.markAllAsRead = function(userId) {
  let count = 0;
  this.messages.forEach(msg => {
    if (msg.senderId.toString() !== userId.toString() && !msg.isRead) {
      msg.isRead = true;
      msg.readAt = Date.now();
      count++;
    }
  });
  return count;
};

// ===================== PRE-SAVE MIDDLEWARE =====================

// Update timestamps and lastMessage before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastMessageAt = Date.now();
  
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.content || '',
      senderId: lastMsg.senderId,
      senderName: lastMsg.senderName,
      createdAt: lastMsg.createdAt,
      mediaType: lastMsg.media && lastMsg.media.length > 0 ? lastMsg.media[0].type : null,
      callType: lastMsg.callType !== 'none' ? lastMsg.callType : null,
      callStatus: lastMsg.callStatus !== 'none' ? lastMsg.callStatus : null
    };
  }
  
  next();
});

// ===================== STATIC METHODS =====================

// Find or create a conversation between two users
messageSchema.statics.findOrCreateConversation = async function(user1Id, user1Type, user1Name, user2Id, user2Type, user2Name) {
  let conversation = await this.findOne({
    participants: {
      $all: [
        { $elemMatch: { userId: user1Id, userType: user1Type } },
        { $elemMatch: { userId: user2Id, userType: user2Type } }
      ]
    }
  });

  if (!conversation) {
    conversation = new this({
      participants: [
        {
          userId: user1Id,
          userType: user1Type,
          name: user1Name
        },
        {
          userId: user2Id,
          userType: user2Type,
          name: user2Name
        }
      ],
      messages: []
    });
    await conversation.save();
  }

  return conversation;
};

// Get all conversations for a user
messageSchema.statics.getUserConversations = async function(userId, userType) {
  return this.find({
    'participants': {
      $elemMatch: {
        userId: userId,
        userType: userType
      }
    }
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants.userId', 'name email avatar')
    .populate('messages.senderId', 'name email avatar');
};

// Get total unread count for a user
messageSchema.statics.getTotalUnreadCount = async function(userId) {
  const conversations = await this.find({
    'participants': {
      $elemMatch: {
        userId: userId
      }
    }
  });

  let total = 0;
  conversations.forEach(conv => {
    total += conv.messages.filter(msg => 
      msg.senderId.toString() !== userId.toString() && !msg.isRead
    ).length;
  });

  return total;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message
};