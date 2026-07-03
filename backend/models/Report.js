const mongoose = require('mongoose');

// Report Schema - Centralized report management
const reportSchema = new mongoose.Schema({
  // Type of content being reported
  targetType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'message']
  },
  
  // Reference to the target ID (post, comment, or message)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  
  // Model name for refPath
  targetModel: {
    type: String,
    required: true,
    enum: ['ForumPost', 'Message']
  },
  
  // Who reported it
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'reportedBy.userType'
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
  
  // Report details
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
  
  // Status management
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  
  // Admin review fields
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
    },
    name: {
      type: String
    }
  },
  
  // Action taken
  actionTaken: {
    type: String,
    enum: ['none', 'hidden', 'deleted', 'warned', 'blocked'],
    default: 'none'
  },
  actionDetails: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
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
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ 'reportedBy.userId': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ reason: 1 });
reportSchema.index({ targetModel: 1 });

// Compound indexes
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ 'reportedBy.userId': 1, status: 1 });

// Virtual for getting the target content
reportSchema.virtual('targetContent', {
  refPath: 'targetModel',
  localField: 'targetId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods
reportSchema.statics.getPendingReports = function() {
  return this.find({ status: 'Pending' }).sort({ createdAt: 1 });
};

reportSchema.statics.getReportsByTarget = function(targetType, targetId) {
  return this.find({ targetType, targetId }).sort({ createdAt: -1 });
};

reportSchema.statics.getReportsByReporter = function(userId) {
  return this.find({ 'reportedBy.userId': userId }).sort({ createdAt: -1 });
};

reportSchema.statics.getReportsByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

reportSchema.statics.getResolvedReports = function() {
  return this.find({ 
    status: { $in: ['Resolved', 'Dismissed'] } 
  }).sort({ createdAt: -1 });
};

// Method to resolve a report
reportSchema.methods.resolveReport = async function(action, note, adminId, adminType, adminName) {
  this.status = 'Resolved';
  this.actionTaken = action || 'none';
  this.adminNote = note || this.adminNote;
  this.reviewedAt = Date.now();
  this.reviewedBy = {
    userId: adminId,
    userType: adminType,
    name: adminName
  };
  await this.save();
};

// Method to dismiss a report
reportSchema.methods.dismissReport = async function(note, adminId, adminType, adminName) {
  this.status = 'Dismissed';
  this.actionTaken = 'none';
  this.adminNote = note || this.adminNote;
  this.reviewedAt = Date.now();
  this.reviewedBy = {
    userId: adminId,
    userType: adminType,
    name: adminName
  };
  await this.save();
};

// Method to review a report (mark as reviewed)
reportSchema.methods.reviewReport = async function(note, adminId, adminType, adminName) {
  this.status = 'Reviewed';
  this.adminNote = note || this.adminNote;
  this.reviewedAt = Date.now();
  this.reviewedBy = {
    userId: adminId,
    userType: adminType,
    name: adminName
  };
  await this.save();
};

const Report = mongoose.model('Report', reportSchema);

module.exports = {
  Report
};