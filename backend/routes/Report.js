// Mapa-Milihan/backend/routes/Report.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/Report');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// ===================== USER REPORT ROUTES =====================
// These routes are accessible to all authenticated users

// Create a report (for posts, comments, messages)
router.post(
  '/report',
  isAuthenticatedUser,
  reportController.createReport
);

// Check if user already reported content
router.get(
  '/check/:targetType/:targetId',
  isAuthenticatedUser,
  reportController.checkUserReported
);

// Get reports by target (for admins and content owners)
router.get(
  '/target/:targetType/:targetId',
  isAuthenticatedUser,
  reportController.getReportsByTarget
);

// Get current user's reports
router.get(
  '/my-reports',
  isAuthenticatedUser,
  reportController.getMyReports
);

// ===================== MESSAGE REPORT ROUTES =====================

// Report a message
router.post(
  '/messages/:messageId/report',
  isAuthenticatedUser,
  reportController.reportMessage
);

// Get reports for a specific message (Admin)
router.get(
  '/messages/:messageId/reports',
  isAuthenticatedUser,
  isAdmin,
  reportController.getMessageReports
);

// Get all message reports (Admin)
router.get(
  '/messages/reports/all',
  isAuthenticatedUser,
  isAdmin,
  reportController.getAllMessageReports
);

// Update message report status (Admin)
router.put(
  '/messages/reports/:reportId/status',
  isAuthenticatedUser,
  isAdmin,
  reportController.updateMessageReportStatus
);

// ===================== ADMIN REPORT MANAGEMENT ROUTES =====================
// All routes below require authentication and admin privileges

// Get all reports (with filters)
router.get(
  '/reports',
  isAuthenticatedUser,
  isAdmin,
  reportController.getAllReports
);

// Get report statistics
router.get(
  '/reports/statistics',
  isAuthenticatedUser,
  isAdmin,
  reportController.getReportStatistics
);

// Get hidden content
router.get(
  '/hidden',
  isAuthenticatedUser,
  isAdmin,
  reportController.getHiddenContent
);

// Update report status
router.put(
  '/reports/:reportId/status',
  isAuthenticatedUser,
  isAdmin,
  reportController.updateReportStatus
);

// Bulk update reports
router.put(
  '/reports/bulk',
  isAuthenticatedUser,
  isAdmin,
  reportController.bulkUpdateReports
);

// Hide content (post, comment, or message)
// IMPORTANT: This route must come AFTER the /reports routes to avoid conflicts
router.post(
  '/hide/:contentType/:contentId',
  isAuthenticatedUser,
  isAdmin,
  reportController.hideContent
);

// Unhide content
router.post(
  '/unhide/:contentType/:contentId',
  isAuthenticatedUser,
  isAdmin,
  reportController.unhideContent
);

// Delete a report
router.delete(
  '/reports/:reportId',
  isAuthenticatedUser,
  isAdmin,
  reportController.deleteReport
);

module.exports = router;