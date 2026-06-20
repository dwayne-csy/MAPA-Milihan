const mongoose = require('mongoose');

// Forum Post Schema
const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'author.userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['User', 'Farmer', 'Admin']
    },
    name: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['General', 'Farming Tips', 'Crops', 'Livestock', 'Market', 'Equipment', 'Other'],
    default: 'General'
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
      enum: ['image', 'video'],
      required: true
    },
    thumbnail: {
      type: String
    }
  }],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'likes.userType'
    },
    userType: {
      type: String,
      required: true,
      enum: ['User', 'Farmer', 'Admin']
    },
    _id: false
  }],
  comments: [{
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'comments.author.userType'
      },
      userType: {
        type: String,
        required: true,
        enum: ['User', 'Farmer', 'Admin']
      },
      name: {
        type: String,
        required: true
      }
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
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
        enum: ['image', 'video'],
        required: true
      }
    }],
    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'comments.likes.userType'
      },
      userType: {
        type: String,
        required: true,
        enum: ['User', 'Farmer', 'Admin']
      },
      _id: false
    }],
    // NEW: Parent comment ID for nested replies
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // NEW: Reference to the user being replied to
    replyToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    replyToUserName: {
      type: String,
      default: null
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
        refPath: 'reports.reportedBy.userType'
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
});

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
        enum: ['image', 'video'],
        required: true
      }
    }],
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
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
    }
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
forumPostSchema.index({ 'author.userId': 1, 'author.userType': 1 });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ category: 1 });
forumPostSchema.index({ 'reports.status': 1 });
forumPostSchema.index({ title: 'text', content: 'text' });
forumPostSchema.index({ 'comments.parentCommentId': 1 });

messageSchema.index({ 'participants.userId': 1, 'participants.userType': 1 });
messageSchema.index({ lastMessageAt: -1 });
messageSchema.index({ 'messages.reports.status': 1 });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = {
  ForumPost,
  Message
};