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

// Indexes for better query performance
forumPostSchema.index({ 'author.userId': 1, 'author.userType': 1 });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ category: 1 });
forumPostSchema.index({ 'reports.status': 1 });
forumPostSchema.index({ title: 'text', content: 'text' });
forumPostSchema.index({ 'comments.parentCommentId': 1 });

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = {
  ForumPost
};