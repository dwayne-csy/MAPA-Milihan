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
  Divider,
  Fade,
  InputAdornment,
  useTheme,
  alpha
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
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const ManageReport = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [hiddenContent, setHiddenContent] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [filter, setFilter] = useState({ status: 'all', type: 'all', search: '' });
  const [tabValue, setTabValue] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({ status: '', reason: '', adminNote: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adminInfo, setAdminInfo] = useState(null);
  const [viewReportDialog, setViewReportDialog] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

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
      } else {
        showSnackbar(error.response?.data?.message || 'Error fetching reports', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter.status, filter.type, filter.search, navigate]);

  const fetchHiddenContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.limit
      });
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.search) params.append('search', filter.search);

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
  }, [pagination.page, pagination.limit, filter.type, filter.search]);

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

  useEffect(() => {
    if (tabValue === 0) {
      fetchReports();
    } else {
      fetchHiddenContent();
    }
    fetchStatistics();
  }, [tabValue, fetchReports, fetchHiddenContent, fetchStatistics]);

  const handleRefresh = () => {
    if (tabValue === 0) fetchReports();
    else fetchHiddenContent();
    fetchStatistics();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const openDialog = (type, report = null) => {
    setSelectedReport(report);
    setDialogType(type);
    setDialogData({ status: '', reason: '', adminNote: '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
  };

  const openViewReportDialog = (report) => {
    setSelectedReportForView(report);
    setViewReportDialog(true);
  };

  const closeViewReportDialog = () => {
    setViewReportDialog(false);
    setSelectedReportForView(null);
  };

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
        { status: dialogData.status, adminNote: dialogData.adminNote },
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

  const handleHideContent = async () => {
    if (!selectedReport) {
      showSnackbar('No report selected', 'error');
      return;
    }

    const contentType = selectedReport.targetType || selectedReport.type;
    const contentId = selectedReport.targetId || selectedReport.contentId;
    const reportId = selectedReport.reportId || selectedReport._id;

    if (!contentType || !contentId) {
      showSnackbar('Missing content information', 'error');
      return;
    }

    if (!dialogData.reason || dialogData.reason.trim() === '') {
      showSnackbar('Please provide a reason for hiding', 'error');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/hide/${contentType}/${contentId}`,
        { reportId, reason: dialogData.reason.trim() },
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`${contentType} hidden successfully`, 'success');
        closeDialog();
        if (tabValue === 0) fetchReports();
        else fetchHiddenContent();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error hiding content', 'error');
      }
    } catch (error) {
      console.error('Error hiding content:', error);
      showSnackbar(error.response?.data?.message || 'Error hiding content', 'error');
    }
  };

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

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Reviewed': return 'info';
      case 'Resolved': return 'success';
      case 'Dismissed': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'post': return <PostIcon fontSize="small" />;
      case 'comment': return <CommentIcon fontSize="small" />;
      case 'message': return <MessageIcon fontSize="small" />;
      default: return <ReportIcon fontSize="small" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
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

  if (!adminInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeftNavigationBar />
        <div className="ml-64 p-8 flex items-center justify-center min-h-[80vh]">
          <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500, borderRadius: 3 }}>
            <ShieldIcon color="error" sx={{ fontSize: 72, mb: 2 }} />
            <Typography variant="h5" color="error" gutterBottom fontWeight="bold">
              Access Denied
            </Typography>
            <Typography variant="body1" color="textSecondary">
              You do not have permission to access this page.
            </Typography>
          </Paper>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeftNavigationBar />
      
      <div className="ml-64 p-6">
        <Container maxWidth="xl" sx={{ py: 2 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                <ReportIcon sx={{ color: theme.palette.error.main }} />
              </Paper>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Report Management
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Monitor and manage reported content
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          {/* Statistics Cards */}
          {statistics && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Reports', value: statistics.total || 0, color: '#1565C0', icon: <DashboardIcon /> },
                { label: 'Pending', value: statistics.pending || 0, color: '#ED6C02', icon: <WarningIcon /> },
                { label: 'Reviewed', value: statistics.reviewed || 0, color: '#0288D1', icon: <CheckCircleIcon /> },
                { label: 'Resolved', value: statistics.resolved || 0, color: '#2E7D32', icon: <DoneAllIcon /> },
                { label: 'Dismissed', value: statistics.dismissed || 0, color: '#D32F2F', icon: <CancelIcon /> },
              ].map((stat) => (
                <Grid item xs={12} sm={6} md={2.4} key={stat.label}>
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
          )}

          {/* Main Content */}
          <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab
                  label={
                    <Badge badgeContent={statistics?.total || 0} color="error" sx={{ '& .MuiBadge-badge': { top: -4 } }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ReportIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={tabValue === 0 ? 'bold' : 'normal'}>
                          Active Reports
                        </Typography>
                      </Stack>
                    </Badge>
                  }
                />
                <Tab
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HistoryIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={tabValue === 1 ? 'bold' : 'normal'}>
                        Hidden Content
                      </Typography>
                    </Stack>
                  }
                />
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
                  sx={{ minWidth: 250, flex: 1 }}
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
                    name="status"
                    value={filter.status}
                    onChange={handleFilterChange}
                    displayEmpty
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Reviewed">Reviewed</MenuItem>
                    <MenuItem value="Resolved">Resolved</MenuItem>
                    <MenuItem value="Dismissed">Dismissed</MenuItem>
                  </Select>
                </FormControl>
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
                    setFilter({ status: 'all', type: 'all', search: '' });
                    setPagination(prev => ({ ...prev, page: 0 }));
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Content</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reported By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={40} />
                      </TableCell>
                    </TableRow>
                  ) : tabValue === 0 ? (
                    reports.length > 0 ? (
                      reports.map((report) => {
                        const isHidden = report.isHidden || 
                          (report.contentDetails && report.contentDetails.isHidden) || false;
                        const contentType = report.targetType || 'unknown';
                        const contentDetails = report.contentDetails || {};
                        const reporterDetails = report.reporterDetails || {};
                        
                        let contentDisplay = '';
                        if (contentType === 'post') {
                          contentDisplay = contentDetails.title || contentDetails.content || 'Post';
                        } else if (contentType === 'comment') {
                          contentDisplay = contentDetails.content || 'Comment';
                        } else if (contentType === 'message') {
                          contentDisplay = contentDetails.content || 'Message';
                        }

                        return (
                          <TableRow key={report._id || report.reportId} hover>
                            <TableCell>
                              <Chip
                                icon={getTypeIcon(contentType)}
                                label={contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                {contentDisplay || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                  {(contentDetails.author?.name || contentDetails.sender?.name || 'U').charAt(0)}
                                </Avatar>
                                <Typography variant="body2" noWrap>
                                  {(contentDetails.author?.name || contentDetails.sender?.name || 'Unknown')}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'grey.300' }}>
                                  {(reporterDetails.name || 'U').charAt(0)}
                                </Avatar>
                                <Typography variant="body2" noWrap>
                                  {reporterDetails.name || 'Unknown'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={report.reason || 'N/A'}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 1, maxWidth: 120 }}
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
                            <TableCell>
                              <Stack direction="row" spacing={0.5} justifyContent="center">
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
                                <Tooltip title="Update Status">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDialog('status', report)}
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                    }}
                                  >
                                    <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                  </IconButton>
                                </Tooltip>
                                {!isHidden ? (
                                  <Tooltip title="Hide Content">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialog('hide', report)}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                      }}
                                    >
                                      <VisibilityOffIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
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
                                    onClick={() => openDialog('delete', report)}
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={1}>
                            <ReportIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                            <Typography variant="body1" color="textSecondary">
                              No reports found
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    hiddenContent.length > 0 ? (
                      hiddenContent.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            <Chip
                              icon={getTypeIcon(item.type)}
                              label={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                              {item.type === 'post' ? item.title :
                               item.type === 'comment' ? item.postTitle || item.content :
                               item.content || 'Message'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                {(item.author?.name || item.sender?.name || 'U').charAt(0)}
                              </Avatar>
                              <Typography variant="body2" noWrap>
                                {(item.author?.name || item.sender?.name || 'Unknown')}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="error" noWrap sx={{ maxWidth: 150 }}>
                              {item.hideReason || 'No reason provided'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(item.hiddenAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedReportForView({
                                      ...item,
                                      targetType: item.type,
                                      contentDetails: item,
                                      reporterDetails: item.hiddenBy
                                    });
                                    setViewReportDialog(true);
                                  }}
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Unhide Content">
                                <IconButton
                                  size="small"
                                  onClick={() => handleUnhideContent(item)}
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                                  }}
                                >
                                  <VisibilityOffIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={1}>
                            <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                            <Typography variant="body1" color="textSecondary">
                              No hidden content found
                            </Typography>
                          </Stack>
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
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </Paper>
        </Container>
      </div>

      {/* Dialogs - Same as before */}
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
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
                      sx={{ 
                        bgcolor: alpha(getStatusBadgeColor(selectedReportForView.status || 'Pending'), 0.1),
                        color: getStatusBadgeColor(selectedReportForView.status || 'Pending')
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Content</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {selectedReportForView.contentDetails?.fullContent || 
                         selectedReportForView.contentDetails?.content || 
                         selectedReportForView.content || 
                         'No content available'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewReportDialog} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
              <TextField
                label="Reason for hiding"
                multiline
                rows={3}
                value={dialogData.reason}
                onChange={(e) => setDialogData(prev => ({ ...prev, reason: e.target.value }))}
                fullWidth
                placeholder="Provide a reason for hiding this content..."
                required
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
            sx={{ borderRadius: 2 }}
          >
            {dialogType === 'status' ? 'Update' :
             dialogType === 'hide' ? 'Hide' :
             dialogType === 'delete' ? 'Delete' :
             'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ManageReport;