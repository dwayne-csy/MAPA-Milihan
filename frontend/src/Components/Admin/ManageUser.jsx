// Mapa-Milihan/frontend/src/Components/Admin/ManageUser.jsx
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
  Avatar,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Checkbox,
  InputAdornment,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Agriculture as FarmerIcon,
  PersonAdd as UserIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Verified as VerifiedIcon,
  Shield as ShieldIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const ManageUser = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [filter, setFilter] = useState({ role: 'all', status: 'all', search: '' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogData, setDialogData] = useState({ role: '', reason: '', adminNote: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adminInfo, setAdminInfo] = useState(null);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [actionType, setActionType] = useState('single');
  const [tabValue, setTabValue] = useState(0);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.limit
      });
      if (filter.role !== 'all') params.append('role', filter.role);
      if (filter.status !== 'all') {
        if (filter.status === 'active') params.append('isActive', 'true');
        if (filter.status === 'inactive') params.append('isActive', 'false');
        if (filter.status === 'deleted') params.append('isDeleted', 'true');
      }
      if (filter.search) params.append('search', filter.search);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/users?${params}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalUsers,
          pages: Math.ceil(response.data.pagination.totalUsers / prev.limit)
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        showSnackbar('Session expired. Please login again.', 'error');
        navigate('/login');
      } else {
        showSnackbar(error.response?.data?.message || 'Error fetching users', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter.role, filter.status, filter.search, navigate]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/users/stats`,
        getAuthHeaders()
      );
      if (response.data.success) {
        setStatistics(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [fetchUsers, fetchStatistics]);

  const handleRefresh = () => {
    fetchUsers();
    fetchStatistics();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
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

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = users.filter(u => !u.isDeleted).map((user) => user._id);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  const handleSelectClick = (event, userId) => {
    const selectedIndex = selectedUsers.indexOf(userId);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedUsers, userId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedUsers.slice(1));
    } else if (selectedIndex === selectedUsers.length - 1) {
      newSelected = newSelected.concat(selectedUsers.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedUsers.slice(0, selectedIndex),
        selectedUsers.slice(selectedIndex + 1)
      );
    }
    setSelectedUsers(newSelected);
  };

  const openDialog = (type, user = null, bulk = false) => {
    setSelectedUser(user);
    setDialogType(type);
    setActionType(bulk ? 'bulk' : 'single');
    setDialogData({ role: user?.role || '', reason: '', adminNote: '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const openViewUserDialog = (user) => {
    setSelectedUserForView(user);
    setViewUserDialog(true);
  };

  const closeViewUserDialog = () => {
    setViewUserDialog(false);
    setSelectedUserForView(null);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !dialogData.role) {
      showSnackbar('Please select a role', 'error');
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/role`,
        { role: dialogData.role },
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`User role updated to ${dialogData.role}`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error updating role', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showSnackbar(error.response?.data?.message || 'Error updating role', 'error');
    }
  };

  const handleDeactivate = async () => {
    const userIds = actionType === 'bulk' ? selectedUsers : [selectedUser?._id];
    if (userIds.length === 0 || !userIds[0]) {
      showSnackbar('No users selected', 'error');
      return;
    }

    try {
      if (actionType === 'bulk') {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/admin/users/bulk/deactivate`,
          { userIds },
          getAuthHeaders()
        );
        if (response.data.success) {
          showSnackbar(`${response.data.modifiedCount || userIds.length} user(s) deactivated`, 'success');
          closeDialog();
          setSelectedUsers([]);
          fetchUsers();
          fetchStatistics();
        }
      } else {
        const response = await axios.put(
          `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/deactivate`,
          {},
          getAuthHeaders()
        );
        if (response.data.success) {
          showSnackbar(`${selectedUser.name} deactivated`, 'success');
          closeDialog();
          fetchUsers();
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error('Error deactivating user(s):', error);
      showSnackbar(error.response?.data?.message || 'Error deactivating user(s)', 'error');
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/activate`,
        {},
        getAuthHeaders()
      );
      if (response.data.success) {
        showSnackbar(`${selectedUser.name} activated`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showSnackbar(error.response?.data?.message || 'Error activating user', 'error');
    }
  };

  const handleSoftDelete = async () => {
    const userIds = actionType === 'bulk' ? selectedUsers : [selectedUser?._id];
    if (userIds.length === 0 || !userIds[0]) {
      showSnackbar('No users selected', 'error');
      return;
    }

    try {
      if (actionType === 'bulk') {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/admin/users/bulk/soft-delete`,
          { userIds },
          getAuthHeaders()
        );
        if (response.data.success) {
          showSnackbar(`${response.data.modifiedCount || userIds.length} user(s) deleted`, 'success');
          closeDialog();
          setSelectedUsers([]);
          fetchUsers();
          fetchStatistics();
        }
      } else {
        const response = await axios.put(
          `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/soft-delete`,
          {},
          getAuthHeaders()
        );
        if (response.data.success) {
          showSnackbar(`${selectedUser.name} deleted`, 'success');
          closeDialog();
          fetchUsers();
          fetchStatistics();
        }
      }
    } catch (error) {
      console.error('Error deleting user(s):', error);
      showSnackbar(error.response?.data?.message || 'Error deleting user(s)', 'error');
    }
  };

  const handleRestore = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/restore`,
        {},
        getAuthHeaders()
      );
      if (response.data.success) {
        showSnackbar(`${selectedUser.name} restored`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      showSnackbar(error.response?.data?.message || 'Error restoring user', 'error');
    }
  };

  const handleHardDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/hard-delete`,
        getAuthHeaders()
      );
      if (response.data.success) {
        showSnackbar(`${selectedUser.name} permanently deleted`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      showSnackbar(error.response?.data?.message || 'Error permanently deleting user', 'error');
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin': return 'warning';
      case 'farmer': return 'success';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminIcon fontSize="small" />;
      case 'farmer': return <FarmerIcon fontSize="small" />;
      default: return <UserIcon fontSize="small" />;
    }
  };

  const getStatusBadgeColor = (user) => {
    if (user.isDeleted) return '#D32F2F';
    if (user.isActive) return '#2E7D32';
    return '#ED6C02';
  };

  const getStatusLabel = (user) => {
    if (user.isDeleted) return 'Deleted';
    if (user.isActive) return 'Active';
    return 'Inactive';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const renderAvatar = (user) => {
    if (user?.avatar?.url) {
      return <Avatar src={user.avatar.url} alt={user.name} sx={{ width: 40, height: 40 }} />;
    }
    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: '#2E7D32' }}>
        {user?.name?.charAt(0) || 'U'}
      </Avatar>
    );
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
              <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <PeopleIcon sx={{ color: theme.palette.primary.main }} />
              </Paper>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  User Management
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Manage all registered users and their permissions
                </Typography>
              </Box>
            </Stack>
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

          {/* Statistics Cards */}
          {statistics && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: 'Total Users', value: statistics.total || 0, color: '#1565C0', icon: <DashboardIcon /> },
                { label: 'Active', value: statistics.active || 0, color: '#2E7D32', icon: <CheckCircleIcon /> },
                { label: 'Inactive', value: statistics.inactive || 0, color: '#ED6C02', icon: <BlockIcon /> },
                { label: 'Verified', value: statistics.verified || 0, color: '#0288D1', icon: <VerifiedIcon /> },
                { label: 'Deleted', value: statistics.deleted || 0, color: '#757575', icon: <DeleteIcon /> },
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
            {/* Filters */}
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search by name or email..."
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
                    name="role"
                    value={filter.role}
                    onChange={handleFilterChange}
                    displayEmpty
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="farmer">Farmer</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    name="status"
                    value={filter.status}
                    onChange={handleFilterChange}
                    displayEmpty
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                  </Select>
                </FormControl>
                {selectedUsers.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => openDialog('deactivate', null, true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Deactivate ({selectedUsers.length})
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => openDialog('delete', null, true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Delete ({selectedUsers.length})
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setSelectedUsers([])}
                      sx={{ color: 'text.secondary' }}
                    >
                      Clear
                    </Button>
                  </Stack>
                )}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setFilter({ role: 'all', status: 'all', search: '' });
                    setPagination(prev => ({ ...prev, page: 0 }));
                    setSelectedUsers([]);
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.filter(u => !u.isDeleted).length}
                        checked={users.filter(u => !u.isDeleted).length > 0 && selectedUsers.length === users.filter(u => !u.isDeleted).length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Verification</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={40} />
                      </TableCell>
                    </TableRow>
                  ) : users.length > 0 ? (
                    users.map((user) => {
                      const isDeleted = user.isDeleted || false;
                      const isActive = user.isActive || false;
                      const isVerified = user.isVerified || false;
                      const role = user.role || 'user';

                      return (
                        <TableRow key={user._id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedUsers.includes(user._id)}
                              onChange={(event) => handleSelectClick(event, user._id)}
                              disabled={isDeleted}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              {renderAvatar(user)}
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={role}
                              size="small"
                              icon={getRoleIcon(role)}
                              sx={{ 
                                borderRadius: 1,
                                bgcolor: alpha(getRoleChipColor(role) === 'warning' ? '#ED6C02' : 
                                              getRoleChipColor(role) === 'success' ? '#2E7D32' : '#0288D1', 0.1),
                                color: getRoleChipColor(role) === 'warning' ? '#ED6C02' : 
                                      getRoleChipColor(role) === 'success' ? '#2E7D32' : '#0288D1',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(user)}
                              size="small"
                              sx={{ 
                                borderRadius: 1,
                                bgcolor: alpha(getStatusBadgeColor(user), 0.1),
                                color: getStatusBadgeColor(user),
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {isVerified ? (
                              <Chip
                                label="Verified"
                                size="small"
                                icon={<VerifiedIcon fontSize="small" />}
                                sx={{ 
                                  borderRadius: 1,
                                  bgcolor: alpha('#2E7D32', 0.1),
                                  color: '#2E7D32',
                                  fontWeight: 500
                                }}
                              />
                            ) : (
                              <Chip
                                label="Unverified"
                                size="small"
                                sx={{ 
                                  borderRadius: 1,
                                  bgcolor: alpha('#ED6C02', 0.1),
                                  color: '#ED6C02',
                                  fontWeight: 500
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(user.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => openViewUserDialog(user)}
                                  sx={{ 
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                </IconButton>
                              </Tooltip>
                              {!isDeleted ? (
                                <>
                                  <Tooltip title="Change Role">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialog('role', user)}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                      }}
                                    >
                                      <EditIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                    </IconButton>
                                  </Tooltip>
                                  {isActive ? (
                                    <Tooltip title="Deactivate">
                                      <IconButton
                                        size="small"
                                        onClick={() => openDialog('deactivate', user)}
                                        sx={{ 
                                          bgcolor: alpha('#ED6C02', 0.1),
                                          '&:hover': { bgcolor: alpha('#ED6C02', 0.2) }
                                        }}
                                      >
                                        <BlockIcon fontSize="small" sx={{ color: '#ED6C02' }} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Activate">
                                      <IconButton
                                        size="small"
                                        onClick={() => openDialog('activate', user)}
                                        sx={{ 
                                          bgcolor: alpha('#2E7D32', 0.1),
                                          '&:hover': { bgcolor: alpha('#2E7D32', 0.2) }
                                        }}
                                      >
                                        <CheckCircleIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialog('delete', user)}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Restore">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialog('restore', user)}
                                      sx={{ 
                                        bgcolor: alpha('#2E7D32', 0.1),
                                        '&:hover': { bgcolor: alpha('#2E7D32', 0.2) }
                                      }}
                                    >
                                      <RestoreIcon fontSize="small" sx={{ color: '#2E7D32' }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Permanent Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialog('hardDelete', user)}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Stack alignItems="center" spacing={1}>
                          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                          <Typography variant="body1" color="textSecondary">
                            No users found
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
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

      {/* View User Dialog */}
      <Dialog open={viewUserDialog} onClose={closeViewUserDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">User Details</Typography>
            <IconButton onClick={closeViewUserDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUserForView && (
            <Stack spacing={2}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  {renderAvatar(selectedUserForView)}
                  <Box>
                    <Typography variant="h6">{selectedUserForView.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedUserForView.email}
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Role</Typography>
                    <Chip
                      label={selectedUserForView.role}
                      size="small"
                      icon={getRoleIcon(selectedUserForView.role)}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Chip
                      label={getStatusLabel(selectedUserForView)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Verification</Typography>
                    <Typography variant="body2">
                      {selectedUserForView.isVerified ? 'Verified ✅' : 'Not Verified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Joined</Typography>
                    <Typography variant="body2">{formatDate(selectedUserForView.createdAt)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Contact Information</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Contact Number</Typography>
                    <Typography variant="body2">
                      {selectedUserForView.contact || 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Address</Typography>
                    <Typography variant="body2">
                      {selectedUserForView.address ? 
                        `${selectedUserForView.address.street || ''} ${selectedUserForView.address.barangay || ''} ${selectedUserForView.address.city || ''}`.trim() || 'Not provided'
                        : 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewUserDialog} variant="contained" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialogs */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'role' && 'Change User Role'}
          {dialogType === 'deactivate' && (actionType === 'bulk' ? 'Deactivate Users' : 'Deactivate User')}
          {dialogType === 'activate' && 'Activate User'}
          {dialogType === 'delete' && (actionType === 'bulk' ? 'Delete Users' : 'Delete User')}
          {dialogType === 'restore' && 'Restore User'}
          {dialogType === 'hardDelete' && 'Permanently Delete User'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'role' && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                User: <strong>{selectedUser?.name}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current Role: <strong>{selectedUser?.role}</strong>
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={dialogData.role}
                  onChange={(e) => setDialogData(prev => ({ ...prev, role: e.target.value }))}
                  displayEmpty
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="farmer">Farmer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
          {dialogType === 'deactivate' && (
            <Typography variant="body2" color="warning" sx={{ mt: 1 }}>
              {actionType === 'bulk' 
                ? `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`
                : `Are you sure you want to deactivate ${selectedUser?.name}?`}
            </Typography>
          )}
          {dialogType === 'delete' && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {actionType === 'bulk'
                ? `Are you sure you want to delete ${selectedUsers.length} user(s)? They can be restored.`
                : `Are you sure you want to delete ${selectedUser?.name}? They can be restored.`}
            </Typography>
          )}
          {dialogType === 'hardDelete' && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              <strong>WARNING:</strong> Are you sure you want to permanently delete {selectedUser?.name}? This cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={
              dialogType === 'role' ? handleChangeRole :
              dialogType === 'deactivate' ? handleDeactivate :
              dialogType === 'activate' ? handleActivate :
              dialogType === 'delete' ? handleSoftDelete :
              dialogType === 'restore' ? handleRestore :
              dialogType === 'hardDelete' ? handleHardDelete :
              closeDialog
            }
            variant="contained"
            color={dialogType === 'hardDelete' || dialogType === 'delete' ? 'error' :
                   dialogType === 'deactivate' ? 'warning' :
                   dialogType === 'activate' || dialogType === 'restore' ? 'success' :
                   'primary'}
            sx={{ borderRadius: 2 }}
          >
            {dialogType === 'role' ? 'Update Role' :
             dialogType === 'deactivate' ? 'Deactivate' :
             dialogType === 'activate' ? 'Activate' :
             dialogType === 'delete' ? 'Delete' :
             dialogType === 'restore' ? 'Restore' :
             dialogType === 'hardDelete' ? 'Permanently Delete' :
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

export default ManageUser;