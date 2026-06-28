const mongoose = require('mongoose');

// Register Farmer and Admin as aliases for User model
// This allows refPath to work without creating separate models
try {
  // Check if models are already registered to avoid duplicate registration errors
  if (!mongoose.modelNames().includes('Farmer')) {
    mongoose.model('Farmer', mongoose.model('User').schema);
  }
  if (!mongoose.modelNames().includes('Admin')) {
    mongoose.model('Admin', mongoose.model('User').schema);
  }
} catch (e) {
  // Models might already be registered or User model might not be loaded yet
  console.log('Note: Farmer/Admin models will be registered when User model is available');
}

// Message Schema
const messageSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'participants.userType' // This will look for 'User', 'Farmer', or 'Admin' models
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
      required: true,
      refPath: 'messages.senderType' // Add this to properly reference the sender
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
        type: Number
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
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      deletedAt: {
        type: Date,
        default: Date.now
      }
    }],
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
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: {
      type: String
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'lastMessage.senderType'
    },
    senderType: {
      type: String,
      enum: ['User', 'Farmer', 'Admin']
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
  blockedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

messageSchema.index({ 'participants.userId': 1, 'participants.userType': 1 });
messageSchema.index({ lastMessageAt: -1 });
messageSchema.index({ 'messages.reports.status': 1 });
messageSchema.index({ 'messages.createdAt': -1 });
messageSchema.index({ 'participants.isBlocked': 1 });
messageSchema.index({ 'blockedBy.userId': 1 });

// ===================== VIRTUALS =====================

messageSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

// ===================== METHODS =====================

messageSchema.methods.isUserBlocked = function(userId) {
  return this.blockedBy.some(block => block.userId.toString() === userId.toString());
};

messageSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

messageSchema.methods.getUnreadCountForUser = function(userId) {
  return this.messages.filter(msg => 
    msg.senderId.toString() !== userId.toString() && !msg.isRead
  ).length;
};

messageSchema.methods.getLastMessage = function() {
  if (this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
};

messageSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.userId.toString() !== userId.toString());
};

messageSchema.methods.hasBlocked = function(userId) {
  const user = this.participants.find(p => p.userId.toString() === userId.toString());
  return user ? user.isBlocked : false;
};

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

messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastMessageAt = Date.now();
  
  if (this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.content || '',
      senderId: lastMsg.senderId,
      senderType: lastMsg.senderType,
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