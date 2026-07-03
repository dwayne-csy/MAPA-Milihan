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
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    replyToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    replyToUserName: {
      type: String,
      default: null
    },
    // Report Management Fields
    isHidden: {
      type: Boolean,
      default: false
    },
    hiddenAt: {
      type: Date,
      default: null
    },
    hiddenBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userType: {
        type: String,
        enum: ['User', 'Farmer', 'Admin']
      }
    },
    hideReason: {
      type: String,
      default: null
    },
    unhiddenAt: {
      type: Date,
      default: null
    },
    unhiddenBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userType: {
        type: String,
        enum: ['User', 'Farmer', 'Admin']
      }
    },
    // Report tracking
    reports: [{
      reportedBy: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'comments.reports.reportedBy.userType'
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
      adminNote: {
        type: String,
        trim: true,
        maxlength: 500
      },
      reviewedAt: {
        type: Date
      },
      reviewedBy: {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        userType: {
          type: String,
          enum: ['User', 'Farmer', 'Admin']
        }
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
  // Report Management Fields for Post
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenAt: {
    type: Date,
    default: null
  },
  hiddenBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['User', 'Farmer', 'Admin']
    }
  },
  hideReason: {
    type: String,
    default: null
  },
  unhiddenAt: {
    type: Date,
    default: null
  },
  unhiddenBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['User', 'Farmer', 'Admin']
    }
  },
  // Post Reports
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
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userType: {
        type: String,
        enum: ['User', 'Farmer', 'Admin']
      }
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

// Indexes for better query performance
forumPostSchema.index({ 'author.userId': 1, 'author.userType': 1 });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ category: 1 });
forumPostSchema.index({ 'reports.status': 1 });
forumPostSchema.index({ title: 'text', content: 'text' });
forumPostSchema.index({ 'comments.parentCommentId': 1 });
forumPostSchema.index({ isHidden: 1 });
forumPostSchema.index({ 'comments.isHidden': 1 });
forumPostSchema.index({ 'reports._id': 1 });
forumPostSchema.index({ 'comments.reports._id': 1 });

// Virtual for getting visible posts (not hidden)
forumPostSchema.statics.getVisiblePosts = function(filter = {}) {
  return this.find({ ...filter, isHidden: { $ne: true } });
};

// Virtual for getting visible comments
forumPostSchema.methods.getVisibleComments = function() {
  return this.comments.filter(comment => !comment.isHidden);
};

// Pre-save middleware
forumPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = {
  ForumPost
};