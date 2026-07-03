// Mapa-Milihan/frontend/src/Components/Admin/ManageReport.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import { getUser, isAuthenticated, getToken } from '../utils/helper';
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
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
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Report as ReportIcon,
  Message as MessageIcon,
  Comment as CommentIcon,
  PostAdd as PostIcon,
  DoneAll as DoneAllIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// API URL - using Vite environment variable, fallback to port 4001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const ManageReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [hiddenContent, setHiddenContent] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [filter, setFilter] = useState({ status: 'all', type: 'all' });
  const [tabValue, setTabValue] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({ status: '', reason: '', adminNote: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adminInfo, setAdminInfo] = useState(null);
  const [viewReportDialog, setViewReportDialog] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState(null);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const user = getUser();
    if (user?.role !== 'admin' && user?.userType !== 'Admin') {
      navigate('/home');
      return;
    }
    
    setAdminInfo(user);
  }, [navigate]);

  // Auth headers
  const getAuthHeaders = () => {
    const token = getToken();
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

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/reports?${params}`,
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
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (error.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
        navigate('/login');
      } else if (error.response?.status === 403) {
        showSnackbar('You do not have admin permissions.', 'error');
      } else {
        showSnackbar(error.response?.data?.message || 'Error fetching reports', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter.status, filter.type, navigate]);

  // Fetch hidden content
  const fetchHiddenContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.limit
      });
      if (filter.type !== 'all') params.append('type', filter.type);

      const response = await axios.get(
        `${API_BASE_URL}/api/admin/hidden?${params}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setHiddenContent(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching hidden content:', error);
      showSnackbar(error.response?.data?.message || 'Error fetching hidden content', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter.type]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/reports/statistics`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (tabValue === 0) {
      fetchReports();
    } else if (tabValue === 1) {
      fetchHiddenContent();
    }
    fetchStatistics();
  }, [tabValue, fetchReports, fetchHiddenContent, fetchStatistics]);

  // Refresh data
  const handleRefresh = () => {
    if (tabValue === 0) {
      fetchReports();
    } else if (tabValue === 1) {
      fetchHiddenContent();
    }
    fetchStatistics();
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
  };

  // Open dialog
  const openDialog = (type, report = null) => {
    setSelectedReport(report);
    setDialogType(type);
    setDialogData({ status: '', reason: '', adminNote: '' });
    setDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
  };

  // Open view report dialog
  const openViewReportDialog = (report) => {
    setSelectedReportForView(report);
    setViewReportDialog(true);
  };

  // Close view report dialog
  const closeViewReportDialog = () => {
    setViewReportDialog(false);
    setSelectedReportForView(null);
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!selectedReport) {
      showSnackbar('No report selected', 'error');
      return;
    }

    if (!dialogData.status) {
      showSnackbar('Please select a status', 'error');
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/reports/${selectedReport.reportId || selectedReport._id}/status`,
        {
          status: dialogData.status,
          adminNote: dialogData.adminNote
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`Report status updated to ${dialogData.status}`, 'success');
        closeDialog();
        fetchReports();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error updating status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar(error.response?.data?.message || 'Error updating status', 'error');
    }
  };

  // Handle hide content
  const handleHideContent = async () => {
    if (!selectedReport) {
      showSnackbar('No report selected', 'error');
      return;
    }

    const contentType = selectedReport.targetType || selectedReport.type;
    const contentId = selectedReport.targetId || selectedReport.contentId;
    const reportId = selectedReport.reportId || selectedReport._id;

    console.log('🔍 Hiding content with data:', {
      type: contentType,
      contentId: contentId,
      reportId: reportId,
      reason: dialogData.reason
    });

    if (!contentType) {
      showSnackbar('Report type is missing', 'error');
      return;
    }

    if (!contentId) {
      showSnackbar('Content ID is missing', 'error');
      return;
    }

    if (!dialogData.reason || dialogData.reason.trim() === '') {
      showSnackbar('Please provide a reason for hiding', 'error');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/hide/${contentType}/${contentId}`,
        {
          reportId: reportId,
          reason: dialogData.reason.trim()
        },
        getAuthHeaders()
      );

      console.log('✅ Hide response:', response.data);

      if (response.data.success) {
        showSnackbar(`${contentType} hidden successfully`, 'success');
        closeDialog();
        if (tabValue === 0) {
          fetchReports();
        } else {
          fetchHiddenContent();
        }
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error hiding content', 'error');
      }
    } catch (error) {
      console.error('❌ Error hiding content:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Error hiding content';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  // Handle unhide content
  const handleUnhideContent = async (item) => {
    if (!item || !item.type || !item._id) {
      showSnackbar('Missing content information', 'error');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/unhide/${item.type}/${item._id}`,
        {},
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`${item.type} unhidden successfully`, 'success');
        fetchHiddenContent();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error unhiding content', 'error');
      }
    } catch (error) {
      console.error('Error unhiding content:', error);
      showSnackbar(error.response?.data?.message || 'Error unhiding content', 'error');
    }
  };

  // Handle delete report
  const handleDeleteReport = async () => {
    if (!selectedReport) {
      showSnackbar('No report selected', 'error');
      return;
    }

    const reportId = selectedReport.reportId || selectedReport._id;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/reports/${reportId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar('Report deleted successfully', 'success');
        closeDialog();
        fetchReports();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error deleting report', 'error');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      showSnackbar(error.response?.data?.message || 'Error deleting report', 'error');
    }
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Reviewed': return 'info';
      case 'Resolved': return 'success';
      case 'Dismissed': return 'error';
      default: return 'default';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'post': return <PostIcon fontSize="small" />;
      case 'comment': return <CommentIcon fontSize="small" />;
      case 'message': return <MessageIcon fontSize="small" />;
      default: return <ReportIcon fontSize="small" />;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  // Render avatar
  const renderAvatar = (user, fallbackIcon = <PersonIcon />) => {
    if (user?.avatar) {
      return (
        <Avatar 
          src={user.avatar} 
          alt={user.name || 'User'}
          sx={{ width: 24, height: 24 }}
        />
      );
    }
    return (
      <Avatar sx={{ width: 24, height: 24, bgcolor: '#2E7D32' }}>
        {user?.name?.charAt(0) || 'U'}
      </Avatar>
    );
  };

  // Render report item
  const renderReportItem = (report) => {
    const isHidden = report.isHidden || 
                     (report.contentDetails && report.contentDetails.isHidden) || 
                     false;
    
    const reportStatus = report.status || 'Pending';
    const reportReason = report.reason || 'N/A';
    const reportCreatedAt = report.createdAt;
    
    const contentType = report.targetType || 'unknown';
    const reportId = report._id || report.reportId;

    const contentDetails = report.contentDetails || {};
    const reporterDetails = report.reporterDetails || {};

    // Get content title/display text
    let contentDisplay = '';
    if (contentType === 'post') {
      contentDisplay = contentDetails.title || contentDetails.content || 'Post';
    } else if (contentType === 'comment') {
      contentDisplay = contentDetails.content || 'Comment';
    } else if (contentType === 'message') {
      contentDisplay = contentDetails.content || 'Message';
    }

    return (
      <TableRow key={reportId} hover>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {getTypeIcon(contentType)}
            <Chip
              label={contentType.charAt(0).toUpperCase() + contentType.slice(1)}
              size="small"
              color={contentType === 'post' ? 'primary' : contentType === 'comment' ? 'success' : 'info'}
              variant="outlined"
            />
            {isHidden && (
              <Chip
                label="Hidden"
                size="small"
                color="error"
                icon={<VisibilityOffIcon fontSize="small" />}
              />
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {contentDisplay}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {renderAvatar(contentDetails.author || contentDetails.sender)}
            <Typography variant="body2">
              {(contentDetails.author?.name || contentDetails.sender?.name || 'Unknown')}
            </Typography>
            <Chip
              label={contentDetails.author?.userType || contentDetails.sender?.userType || 'User'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 20 }}
            />
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {renderAvatar(reporterDetails)}
            <Typography variant="body2">
              {reporterDetails.name || 'Unknown'}
            </Typography>
            <Chip
              label={reporterDetails.userType || 'User'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.6rem', height: 20 }}
            />
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            label={reportReason}
            size="small"
            variant="outlined"
            color="warning"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={reportStatus}
            size="small"
            color={getStatusChipColor(reportStatus)}
          />
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {formatDate(reportCreatedAt)}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="info"
                onClick={() => openViewReportDialog(report)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Update Status">
              <IconButton
                size="small"
                color="primary"
                onClick={() => openDialog('status', report)}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isHidden ? (
              <Tooltip title="Hide Content">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => openDialog('hide', report)}
                >
                  <VisibilityOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Already Hidden">
                <IconButton size="small" disabled>
                  <VisibilityOffIcon fontSize="small" color="disabled" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete Report">
              <IconButton
                size="small"
                color="error"
                onClick={() => openDialog('delete', report)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // Render hidden content item
  const renderHiddenItem = (item) => {
    return (
      <TableRow key={item._id} hover>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {getTypeIcon(item.type)}
            <Chip
              label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              size="small"
              color={item.type === 'post' ? 'primary' : item.type === 'comment' ? 'success' : 'info'}
              variant="outlined"
            />
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {item.type === 'post' ? item.title :
             item.type === 'comment' ? item.postTitle || item.content :
             item.content || 'Message'}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            {renderAvatar(item.author || item.sender)}
            <Typography variant="body2">
              {(item.author?.name || item.sender?.name || 'Unknown')}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="error">
            {item.hideReason || 'No reason provided'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {formatDate(item.hiddenAt)}
          </Typography>
        </TableCell>
        <TableCell>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              color="info"
              onClick={() => {
                setSelectedReportForView({
                  ...item,
                  targetType: item.type,
                  contentDetails: item,
                  reporterDetails: item.hiddenBy
                });
                setViewReportDialog(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Unhide Content">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleUnhideContent(item)}
            >
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  // Render statistics cards
  const renderStatistics = () => {
    if (!statistics) return null;

    const stats = [
      { label: 'Total Reports', value: statistics.total || 0, color: '#1565C0', icon: <ReportIcon /> },
      { label: 'Pending', value: statistics.pending || 0, color: '#ED6C02', icon: <WarningIcon /> },
      { label: 'Reviewed', value: statistics.reviewed || 0, color: '#0288D1', icon: <CheckCircleIcon /> },
      { label: 'Resolved', value: statistics.resolved || 0, color: '#2E7D32', icon: <DoneAllIcon /> },
      { label: 'Dismissed', value: statistics.dismissed || 0, color: '#D32F2F', icon: <CancelIcon /> },
    ];

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={2.4} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Check if user is admin, if not show access denied
  if (!adminInfo) {
    return (
      <div className="min-h-screen bg-gray-100">
        <LeftNavigationBar />
        <div className="ml-64 p-8 flex items-center justify-center">
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
            <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="textSecondary">
              You do not have permission to access this page. This area is restricted to administrators only.
            </Typography>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <LeftNavigationBar />
      
      <div className="ml-64 p-8">
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReportIcon color="error" />
                Report Management
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>

            {/* Statistics */}
            {renderStatistics()}

            {/* Tabs */}
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab
                label={
                  <Badge badgeContent={statistics?.total || 0} color="error">
                    Reports
                  </Badge>
                }
              />
              <Tab label="Hidden Content" />
            </Tabs>

            {/* Filters */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Reviewed">Reviewed</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={filter.type}
                  onChange={handleFilterChange}
                  label="Type"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="post">Posts</MenuItem>
                  <MenuItem value="comment">Comments</MenuItem>
                  <MenuItem value="message">Messages</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setFilter({ status: 'all', type: 'all' });
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
              >
                Clear Filters
              </Button>
            </Stack>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Content</TableCell>
                    <TableCell>Content Author</TableCell>
                    <TableCell>Reported By</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : tabValue === 0 ? (
                    reports.length > 0 ? (
                      reports.map(renderReportItem)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No reports found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    hiddenContent.length > 0 ? (
                      hiddenContent.map(renderHiddenItem)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No hidden content found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
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
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Paper>
        </Container>
      </div>

      {/* View Report Dialog */}
      <Dialog open={viewReportDialog} onClose={closeViewReportDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Report Details</Typography>
            <IconButton onClick={closeViewReportDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReportForView && (
            <Stack spacing={2}>
              {/* Report Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Report Information</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Type</Typography>
                    <Typography variant="body2">
                      {selectedReportForView.targetType || selectedReportForView.type || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Chip
                      label={selectedReportForView.status || 'Pending'}
                      size="small"
                      color={getStatusChipColor(selectedReportForView.status || 'Pending')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Reason</Typography>
                    <Typography variant="body2">{selectedReportForView.reason || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Reported At</Typography>
                    <Typography variant="body2">{formatDate(selectedReportForView.createdAt)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Reporter Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Reported By</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {renderAvatar(selectedReportForView.reporterDetails)}
                  <Box>
                    <Typography variant="body2">
                      {selectedReportForView.reporterDetails?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedReportForView.reporterDetails?.userType || 'User'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Content Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Content Details</Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {getTypeIcon(selectedReportForView.targetType || selectedReportForView.type)}
                    <Typography variant="body2" fontWeight="bold">
                      {(selectedReportForView.targetType || selectedReportForView.type || 'Unknown').charAt(0).toUpperCase() + 
                       (selectedReportForView.targetType || selectedReportForView.type || 'unknown').slice(1)}
                    </Typography>
                    {selectedReportForView.isHidden && (
                      <Chip label="Hidden" size="small" color="error" />
                    )}
                  </Stack>
                  
                  {/* Content Author */}
                  {selectedReportForView.contentDetails?.author && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="textSecondary">Author:</Typography>
                      {renderAvatar(selectedReportForView.contentDetails.author)}
                      <Typography variant="body2">
                        {selectedReportForView.contentDetails.author.name || 'Unknown'}
                      </Typography>
                      <Chip
                        label={selectedReportForView.contentDetails.author.userType || 'User'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    </Stack>
                  )}
                  
                  {/* Message Sender */}
                  {selectedReportForView.contentDetails?.sender && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="textSecondary">Sender:</Typography>
                      {renderAvatar(selectedReportForView.contentDetails.sender)}
                      <Typography variant="body2">
                        {selectedReportForView.contentDetails.sender.name || 'Unknown'}
                      </Typography>
                      <Chip
                        label={selectedReportForView.contentDetails.sender.userType || 'User'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 20 }}
                      />
                    </Stack>
                  )}
                  
                  {/* Content */}
                  <Box>
                    <Typography variant="caption" color="textSecondary">Content:</Typography>
                    <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {selectedReportForView.contentDetails?.fullContent || 
                         selectedReportForView.contentDetails?.content || 
                         selectedReportForView.content || 
                         'No content available'}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Post Title */}
                  {selectedReportForView.contentDetails?.title && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">Title:</Typography>
                      <Typography variant="body2">
                        {selectedReportForView.contentDetails.title}
                      </Typography>
                    </Box>
                  )}

                  {/* Post Title for comment */}
                  {selectedReportForView.contentDetails?.postTitle && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">Post:</Typography>
                      <Typography variant="body2">
                        {selectedReportForView.contentDetails.postTitle}
                      </Typography>
                    </Box>
                  )}

                  {/* Admin Note */}
                  {selectedReportForView.adminNote && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">Admin Note:</Typography>
                      <Typography variant="body2" color="primary">
                        {selectedReportForView.adminNote}
                      </Typography>
                    </Box>
                  )}

                  {/* Hide Reason */}
                  {selectedReportForView.hideReason && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">Hide Reason:</Typography>
                      <Typography variant="body2" color="error">
                        {selectedReportForView.hideReason}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewReportDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'status' && 'Update Report Status'}
          {dialogType === 'hide' && 'Hide Content'}
          {dialogType === 'delete' && 'Delete Report'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'status' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={dialogData.status}
                  onChange={(e) => setDialogData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Reviewed">Reviewed</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Dismissed">Dismissed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Admin Note"
                multiline
                rows={3}
                value={dialogData.adminNote}
                onChange={(e) => setDialogData(prev => ({ ...prev, adminNote: e.target.value }))}
                fullWidth
                placeholder="Add notes about this decision..."
              />
            </Stack>
          )}

          {dialogType === 'hide' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="error">
                Are you sure you want to hide this {selectedReport?.targetType || selectedReport?.type || 'content'}?
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                <strong>Content:</strong> {
                  selectedReport?.targetType === 'post' ? selectedReport?.contentDetails?.title || selectedReport?.contentDetails?.content || selectedReport?.title :
                  selectedReport?.targetType === 'comment' ? selectedReport?.contentDetails?.content || selectedReport?.content :
                  selectedReport?.contentDetails?.content || selectedReport?.content || 'Message'
                }
              </Typography>
              <TextField
                label="Reason for hiding"
                multiline
                rows={3}
                value={dialogData.reason}
                onChange={(e) => setDialogData(prev => ({ ...prev, reason: e.target.value }))}
                fullWidth
                placeholder="Provide a reason for hiding this content..."
                required
                error={dialogData.reason.trim() === '' && dialogData.reason !== ''}
                helperText={dialogData.reason.trim() === '' && dialogData.reason !== '' ? 'Reason is required' : ''}
              />
            </Stack>
          )}

          {dialogType === 'delete' && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Are you sure you want to delete this report? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={
              dialogType === 'status' ? handleUpdateStatus :
              dialogType === 'hide' ? handleHideContent :
              dialogType === 'delete' ? handleDeleteReport :
              closeDialog
            }
            variant="contained"
            color={dialogType === 'delete' ? 'error' : 'primary'}
          >
            {dialogType === 'status' ? 'Update' :
             dialogType === 'hide' ? 'Hide' :
             dialogType === 'delete' ? 'Delete' :
             'Confirm'}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ManageReport;