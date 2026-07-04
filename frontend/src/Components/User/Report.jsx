import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const FlagIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const CheckCircleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const XCircleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const RefreshIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const ArticleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z"/>
    <line x1="8" y1="8" x2="16" y2="8"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="8" y1="16" x2="12" y2="16"/>
  </svg>
);

const CommentIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const MessageIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronLeftIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Helper Functions ──────────────────────────────────────────────────
const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Reviewed': 'bg-blue-100 text-blue-800 border-blue-200',
    'Resolved': 'bg-green-100 text-green-800 border-green-200',
    'Dismissed': 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return <ClockIcon size={14} />;
    case 'Reviewed': return <EyeIcon size={14} />;
    case 'Resolved': return <CheckCircleIcon size={14} />;
    case 'Dismissed': return <XCircleIcon size={14} />;
    default: return null;
  }
};

const getTargetTypeIcon = (type) => {
  switch (type) {
    case 'post': return <ArticleIcon size={16} />;
    case 'comment': return <CommentIcon size={16} />;
    case 'message': return <MessageIcon size={16} />;
    default: return null;
  }
};

const getTargetTypeLabel = (type) => {
  const labels = {
    'post': 'Post',
    'comment': 'Comment',
    'message': 'Message'
  };
  return labels[type] || type;
};

const getReasonColor = (reason) => {
  const colors = {
    'Spam': 'bg-orange-100 text-orange-800 border-orange-200',
    'Harassment': 'bg-red-100 text-red-800 border-red-200',
    'Inappropriate Content': 'bg-purple-100 text-purple-800 border-purple-200',
    'False Information': 'bg-blue-100 text-blue-800 border-blue-200',
    'Other': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[reason] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

const Report = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
  const limit = 10;

  // Fetch reports
  const fetchReports = async (pageNum = page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/my-reports?page=${pageNum}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setReports(response.data.data);
        setTotalPages(response.data.pagination.pages);
        setTotalReports(response.data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle tab change
  const handleTabChange = (index) => {
    setTabValue(index);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(page);
  };

  // Handle view report details
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  // Filter reports by status
  const getFilteredReports = () => {
    if (tabValue === 0) return reports;
    const statusMap = ['', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'];
    const status = statusMap[tabValue];
    return reports.filter(report => report.status === status);
  };

  const filteredReports = getFilteredReports();

  // Report status counts
  const getStatusCounts = () => {
    const counts = { all: reports.length };
    reports.forEach(report => {
      counts[report.status] = (counts[report.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Get content preview
  const getContentPreview = (report) => {
    if (report.metadata) {
      if (report.targetType === 'message' && report.metadata.messageContent) {
        const content = report.metadata.messageContent;
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
      }
      if (report.targetType === 'post' && report.metadata.postTitle) {
        return report.metadata.postTitle;
      }
    }
    if (report.contentDetails) {
      if (report.targetType === 'post' && report.contentDetails.title) {
        return report.contentDetails.title;
      }
      if (report.contentDetails.content) {
        const content = report.contentDetails.content;
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
      }
    }
    return report.targetId || 'Unknown content';
  };

  if (loading && !refreshing) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-6xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FlagIcon size={24} />
              My Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track all your reported content</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors disabled:opacity-50 shadow-sm border border-gray-200"
          >
            <RefreshIcon size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.Pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.Resolved || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Dismissed</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.Dismissed || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto bg-white rounded-t-lg shadow-sm">
          <div className="flex space-x-1 sm:space-x-2 px-4">
            {['All', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'].map((label, index) => {
              const count = index === 0 ? statusCounts.all : statusCounts[label];
              return (
                <button
                  key={label}
                  onClick={() => handleTabChange(index)}
                  className={`px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    tabValue === index
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label} {count !== undefined && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4">
            {error}
          </div>
        )}

        {/* Reports Table */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {tabValue === 0 
                ? "You haven't submitted any reports yet" 
                : `No ${tabValue === 1 ? 'pending' : tabValue === 2 ? 'reviewed' : tabValue === 3 ? 'resolved' : 'dismissed'} reports`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTargetTypeIcon(report.targetType)}
                          <span className="text-sm text-gray-700">{getTargetTypeLabel(report.targetType)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate" title={getContentPreview(report)}>
                          {getContentPreview(report)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReasonColor(report.reason)}`}>
                          {report.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{formatDate(report.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeftIcon size={14} />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRightIcon size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDetailModal}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {getTargetTypeIcon(selectedReport.targetType)}
                <h3 className="text-xl font-bold text-gray-800">
                  Report Details - {getTargetTypeLabel(selectedReport.targetType)}
                </h3>
              </div>
              <button 
                onClick={handleCloseDetailModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Report ID</p>
                  <p className="text-sm text-gray-800 break-all">{selectedReport._id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Reported On</p>
                  <p className="text-sm text-gray-800">{formatDate(selectedReport.createdAt)}</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Reason & Description */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Reason</p>
                <p className="text-sm font-semibold text-gray-800">{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <hr className="border-gray-200" />

              {/* Content Details */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Content Details</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedReport.metadata?.messageContent || 
                     selectedReport.metadata?.postTitle || 
                     selectedReport.contentDetails?.title ||
                     selectedReport.contentDetails?.content ||
                     selectedReport.targetId}
                  </p>
                  {selectedReport.metadata?.senderName && (
                    <p className="text-xs text-gray-500 mt-1">From: {selectedReport.metadata.senderName}</p>
                  )}
                </div>
              </div>

              {/* Admin Review Section */}
              {selectedReport.status !== 'Pending' && (
                <>
                  <hr className="border-gray-200" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Review</p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      {selectedReport.adminNote && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Note:</strong> {selectedReport.adminNote}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        Reviewed by: {selectedReport.reviewedBy?.name || 'Admin'}
                      </p>
                      {selectedReport.reviewedAt && (
                        <p className="text-sm text-gray-700">
                          Reviewed on: {formatDate(selectedReport.reviewedAt)}
                        </p>
                      )}
                      {selectedReport.actionTaken && selectedReport.actionTaken !== 'none' && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2 ${
                          selectedReport.actionTaken === 'hidden' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          Action: {selectedReport.actionTaken}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleCloseDetailModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;