// Mapa-Milihan/frontend/src/Components/User/Report.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../layouts/Header';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Badge,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Fade,
  InputAdornment,
  TextField,
  MenuItem,
  Select,
  FormControl
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Shield as ShieldIcon,
  Article as ArticleIcon,
  Comment as CommentIcon,
  Message as MessageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const Report = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });
  const [filter, setFilter] = useState({ status: 'all', type: 'all', search: '' });
  const [tabValue, setTabValue] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewReportDialog, setViewReportDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [userInfo, setUserInfo] = useState(null);

  // Get user info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserInfo(userData);
    } catch {
      // Ignore
    }
  }, [navigate]);

  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.limit
      });
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.search) params.append('search', filter.search);

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/my-reports?${params}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setReports(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, filter.status, filter.type, filter.search, navigate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const statusMap = ['all', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'];
    setFilter(prev => ({ ...prev, status: statusMap[newValue] }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSearchChange = (event) => {
    setFilter(prev => ({ ...prev, search: event.target.value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
  };

  const openViewReportDialog = (report) => {
    setSelectedReport(report);
    setViewReportDialog(true);
  };

  const closeViewReportDialog = () => {
    setViewReportDialog(false);
    setSelectedReport(null);
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Reviewed': return 'info';
      case 'Resolved': return 'success';
      case 'Dismissed': return 'error';
      default: return 'default';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pending': return '#ED6C02';
      case 'Reviewed': return '#0288D1';
      case 'Resolved': return '#2E7D32';
      case 'Dismissed': return '#D32F2F';
      default: return '#757575';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'post': return <ArticleIcon fontSize="small" />;
      case 'comment': return <CommentIcon fontSize="small" />;
      case 'message': return <MessageIcon fontSize="small" />;
      default: return <ReportIcon fontSize="small" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'post': 'Post',
      'comment': 'Comment',
      'message': 'Message'
    };
    return labels[type] || type;
  };

  const getReasonColor = (reason) => {
    const colors = {
      'Spam': '#ED6C02',
      'Harassment': '#D32F2F',
      'Inappropriate Content': '#7B1FA2',
      'False Information': '#0288D1',
      'Other': '#757575'
    };
    return colors[reason] || '#757575';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy hh:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getContentPreview = (report) => {
    if (report.metadata) {
      if (report.targetType === 'message' && report.metadata.messageContent) {
        const content = report.metadata.messageContent;
        return content.length > 80 ? content.substring(0, 80) + '...' : content;
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
        return content.length > 80 ? content.substring(0, 80) + '...' : content;
      }
    }
    return report.targetId || 'Unknown content';
  };

  // Get status counts
  const getStatusCounts = () => {
    const counts = { all: reports.length };
    reports.forEach(report => {
      counts[report.status] = (counts[report.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Filter reports for display
  const getFilteredReports = () => {
    let filtered = reports;
    if (filter.status !== 'all') {
      filtered = filtered.filter(r => r.status === filter.status);
    }
    if (filter.type !== 'all') {
      filtered = filtered.filter(r => r.targetType === filter.type);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(r => 
        getContentPreview(r).toLowerCase().includes(search) ||
        r.reason?.toLowerCase().includes(search)
      );
    }
    return filtered;
  };

  const filteredReports = getFilteredReports();

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-6xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
              <ReportIcon sx={{ color: theme.palette.error.main }} />
            </Paper>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                My Reports
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Track and monitor your reported content
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ borderRadius: 2 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Reports', value: statusCounts.all || 0, color: '#1565C0', icon: <DashboardIcon /> },
            { label: 'Pending', value: statusCounts.Pending || 0, color: '#ED6C02', icon: <ScheduleIcon /> },
            { label: 'Resolved', value: statusCounts.Resolved || 0, color: '#2E7D32', icon: <CheckCircleIcon /> },
            { label: 'Dismissed', value: statusCounts.Dismissed || 0, color: '#D32F2F', icon: <CancelIcon /> },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stat.label}
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color, bgcolor: alpha(stat.color, 0.1), p: 1, borderRadius: 2 }}>
                      {stat.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Content */}
        <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              {['All', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'].map((label, index) => {
                const count = index === 0 ? statusCounts.all : statusCounts[label];
                return (
                  <Tab
                    key={label}
                    label={
                      <Badge badgeContent={count} color={index === 1 ? 'warning' : index === 3 ? 'success' : index === 4 ? 'error' : 'primary'}>
                        {label}
                      </Badge>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>

          {/* Filters */}
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search reports..."
                value={filter.search}
                onChange={handleSearchChange}
                sx={{ minWidth: 200, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  name="type"
                  value={filter.type}
                  onChange={handleFilterChange}
                  displayEmpty
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="post">Posts</MenuItem>
                  <MenuItem value="comment">Comments</MenuItem>
                  <MenuItem value="message">Messages</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setFilter({ status: filter.status, type: 'all', search: '' });
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
                sx={{ color: 'text.secondary' }}
              >
                Clear Filters
              </Button>
            </Stack>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Content</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <ReportIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography variant="body1" color="textSecondary">
                          {filter.search || filter.type !== 'all' 
                            ? 'No reports match your filters' 
                            : "You haven't submitted any reports yet"}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report._id} hover>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(report.targetType)}
                          label={getTypeLabel(report.targetType)}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {getContentPreview(report)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.reason || 'N/A'}
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            bgcolor: alpha(getReasonColor(report.reason), 0.1),
                            color: getReasonColor(report.reason)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status || 'Pending'}
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            bgcolor: alpha(getStatusBadgeColor(report.status || 'Pending'), 0.1),
                            color: getStatusBadgeColor(report.status || 'Pending'),
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(report.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openViewReportDialog(report)}
                            sx={{ 
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                            }}
                          >
                            <VisibilityIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </Paper>
      </div>

      {/* View Report Dialog */}
      <Dialog open={viewReportDialog} onClose={closeViewReportDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              {selectedReport && getTypeIcon(selectedReport.targetType)}
              <Typography variant="h6">
                Report Details - {selectedReport && getTypeLabel(selectedReport.targetType)}
              </Typography>
            </Stack>
            <IconButton onClick={closeViewReportDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Stack spacing={3}>
              {/* Basic Info */}
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Report Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Report ID</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {selectedReport._id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Reported On</Typography>
                    <Typography variant="body2">{formatDate(selectedReport.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Chip
                      label={selectedReport.status || 'Pending'}
                      size="small"
                      sx={{ 
                        mt: 0.5,
                        bgcolor: alpha(getStatusBadgeColor(selectedReport.status || 'Pending'), 0.1),
                        color: getStatusBadgeColor(selectedReport.status || 'Pending'),
                        fontWeight: 500
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Reason */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Reason
                </Typography>
                <Chip
                  label={selectedReport.reason || 'N/A'}
                  sx={{ 
                    borderRadius: 1,
                    bgcolor: alpha(getReasonColor(selectedReport.reason), 0.1),
                    color: getReasonColor(selectedReport.reason)
                  }}
                />
                {selectedReport.description && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">Description</Typography>
                    <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedReport.description}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>

              {/* Content */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Content Details
                </Typography>
                <Paper sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedReport.metadata?.messageContent || 
                     selectedReport.metadata?.postTitle || 
                     selectedReport.contentDetails?.title ||
                     selectedReport.contentDetails?.content ||
                     'No content available'}
                  </Typography>
                  {selectedReport.metadata?.senderName && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      From: {selectedReport.metadata.senderName}
                    </Typography>
                  )}
                </Paper>
              </Paper>

              {/* Admin Review */}
              {selectedReport.status !== 'Pending' && (
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Admin Review
                  </Typography>
                  {selectedReport.adminNote && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Note:</strong> {selectedReport.adminNote}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    Reviewed by: {selectedReport.reviewedBy?.name || 'Admin'}
                  </Typography>
                  {selectedReport.reviewedAt && (
                    <Typography variant="body2">
                      Reviewed on: {formatDate(selectedReport.reviewedAt)}
                    </Typography>
                  )}
                  {selectedReport.actionTaken && selectedReport.actionTaken !== 'none' && (
                    <Chip
                      label={`Action: ${selectedReport.actionTaken}`}
                      size="small"
                      sx={{ mt: 1, borderRadius: 1 }}
                    />
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewReportDialog} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Report;