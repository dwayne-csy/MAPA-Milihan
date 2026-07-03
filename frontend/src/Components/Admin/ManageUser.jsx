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
  InputLabel,
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
  Checkbox,
  InputAdornment
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
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// API URL - using Vite environment variable, fallback to port 4001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

const ManageUser = () => {
  const navigate = useNavigate();
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

  // Fetch users
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
      } else if (error.response?.status === 403) {
        showSnackbar('You do not have admin permissions.', 'error');
      } else {
        showSnackbar(error.response?.data?.message || 'Error fetching users', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter.role, filter.status, filter.search, navigate]);

  // Fetch statistics
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

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [fetchUsers, fetchStatistics]);

  // Refresh data
  const handleRefresh = () => {
    fetchUsers();
    fetchStatistics();
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle search
  const handleSearch = (event) => {
    setFilter(prev => ({ ...prev, search: event.target.value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 0 }));
  };

  // Handle select all
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user._id);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  // Handle select one
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

  // Open dialog
  const openDialog = (type, user = null, bulk = false) => {
    setSelectedUser(user);
    setDialogType(type);
    setActionType(bulk ? 'bulk' : 'single');
    setDialogData({ role: user?.role || '', reason: '', adminNote: '' });
    setDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Open view user dialog
  const openViewUserDialog = (user) => {
    setSelectedUserForView(user);
    setViewUserDialog(true);
  };

  // Close view user dialog
  const closeViewUserDialog = () => {
    setViewUserDialog(false);
    setSelectedUserForView(null);
  };

  // Handle change role
  const handleChangeRole = async () => {
    if (!selectedUser) {
      showSnackbar('No user selected', 'error');
      return;
    }

    if (!dialogData.role) {
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

  // Handle deactivate users
  const handleDeactivate = async () => {
    const userIds = actionType === 'bulk' ? selectedUsers : [selectedUser?._id];
    
    if (userIds.length === 0) {
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
          showSnackbar(`${response.data.modifiedCount || userIds.length} user(s) deactivated successfully`, 'success');
          closeDialog();
          setSelectedUsers([]);
          fetchUsers();
          fetchStatistics();
        } else {
          showSnackbar(response.data.message || 'Error deactivating users', 'error');
        }
      } else {
        const response = await axios.put(
          `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/deactivate`,
          {},
          getAuthHeaders()
        );

        if (response.data.success) {
          showSnackbar(`User ${selectedUser.name} deactivated successfully`, 'success');
          closeDialog();
          fetchUsers();
          fetchStatistics();
        } else {
          showSnackbar(response.data.message || 'Error deactivating user', 'error');
        }
      }
    } catch (error) {
      console.error('Error deactivating user(s):', error);
      showSnackbar(error.response?.data?.message || 'Error deactivating user(s)', 'error');
    }
  };

  // Handle activate user
  const handleActivate = async () => {
    if (!selectedUser) {
      showSnackbar('No user selected', 'error');
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/activate`,
        {},
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`User ${selectedUser.name} activated successfully`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error activating user', 'error');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      showSnackbar(error.response?.data?.message || 'Error activating user', 'error');
    }
  };

  // Handle soft delete (bulk or single)
  const handleSoftDelete = async () => {
    const userIds = actionType === 'bulk' ? selectedUsers : [selectedUser?._id];
    
    if (userIds.length === 0) {
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
          showSnackbar(`${response.data.modifiedCount || userIds.length} user(s) deleted successfully`, 'success');
          closeDialog();
          setSelectedUsers([]);
          fetchUsers();
          fetchStatistics();
        } else {
          showSnackbar(response.data.message || 'Error deleting users', 'error');
        }
      } else {
        const response = await axios.put(
          `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/soft-delete`,
          {},
          getAuthHeaders()
        );

        if (response.data.success) {
          showSnackbar(`User ${selectedUser.name} deleted successfully`, 'success');
          closeDialog();
          fetchUsers();
          fetchStatistics();
        } else {
          showSnackbar(response.data.message || 'Error deleting user', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting user(s):', error);
      showSnackbar(error.response?.data?.message || 'Error deleting user(s)', 'error');
    }
  };

  // Handle restore user
  const handleRestore = async () => {
    if (!selectedUser) {
      showSnackbar('No user selected', 'error');
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/restore`,
        {},
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`User ${selectedUser.name} restored successfully`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error restoring user', 'error');
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      showSnackbar(error.response?.data?.message || 'Error restoring user', 'error');
    }
  };

  // Handle hard delete
  const handleHardDelete = async () => {
    if (!selectedUser) {
      showSnackbar('No user selected', 'error');
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/v1/admin/users/${selectedUser._id}/hard-delete`,
        getAuthHeaders()
      );

      if (response.data.success) {
        showSnackbar(`User ${selectedUser.name} permanently deleted`, 'success');
        closeDialog();
        fetchUsers();
        fetchStatistics();
      } else {
        showSnackbar(response.data.message || 'Error permanently deleting user', 'error');
      }
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      showSnackbar(error.response?.data?.message || 'Error permanently deleting user', 'error');
    }
  };

  // Get role chip color
  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin': return 'warning';
      case 'farmer': return 'success';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminIcon fontSize="small" />;
      case 'farmer': return <FarmerIcon fontSize="small" />;
      default: return <UserIcon fontSize="small" />;
    }
  };

  // Get status chip color
  const getStatusChipColor = (user) => {
    if (user.isDeleted) return 'error';
    if (user.isActive) return 'success';
    return 'warning';
  };

  // Get status label
  const getStatusLabel = (user) => {
    if (user.isDeleted) return 'Deleted';
    if (user.isActive) return 'Active';
    return 'Inactive';
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
    if (user?.avatar?.url) {
      return (
        <Avatar 
          src={user.avatar.url} 
          alt={user.name || 'User'}
          sx={{ width: 40, height: 40 }}
        />
      );
    }
    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: '#2E7D32' }}>
        {user?.name?.charAt(0) || 'U'}
      </Avatar>
    );
  };

  // Render statistics cards
  const renderStatistics = () => {
    if (!statistics) return null;

    const stats = [
      { label: 'Total Users', value: statistics.total || 0, color: '#1565C0', icon: <PersonIcon /> },
      { label: 'Active', value: statistics.active || 0, color: '#2E7D32', icon: <CheckCircleIcon /> },
      { label: 'Inactive', value: statistics.inactive || 0, color: '#D32F2F', icon: <BlockIcon /> },
      { label: 'Verified', value: statistics.verified || 0, color: '#0288D1', icon: <CheckCircleIcon /> },
      { label: 'Deleted', value: statistics.deleted || 0, color: '#757575', icon: <DeleteIcon /> },
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

  // Render user item
  const renderUserItem = (user) => {
    const isDeleted = user.isDeleted || false;
    const isActive = user.isActive || false;
    const isVerified = user.isVerified || false;
    const role = user.role || 'user';
    const authProvider = user.authProvider || 'local';

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
            color={getRoleChipColor(role)}
            icon={getRoleIcon(role)}
          />
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(user)}
            size="small"
            color={getStatusChipColor(user)}
          />
        </TableCell>
        <TableCell>
          {isVerified ? (
            <Chip
              label="Verified"
              size="small"
              color="success"
              icon={<CheckCircleIcon fontSize="small" />}
            />
          ) : (
            <Chip
              label="Unverified"
              size="small"
              color="warning"
            />
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={authProvider}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {formatDate(user.createdAt)}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                color="info"
                onClick={() => openViewUserDialog(user)}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {!isDeleted ? (
              <>
                <Tooltip title="Change Role">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openDialog('role', user)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isActive ? (
                  <Tooltip title="Deactivate User">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => openDialog('deactivate', user)}
                    >
                      <BlockIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Activate User">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => openDialog('activate', user)}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete User">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog('delete', user)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Restore User">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => openDialog('restore', user)}
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Permanently Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDialog('hardDelete', user)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </TableCell>
      </TableRow>
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
                <PersonIcon color="primary" />
                User Management
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

            {/* Filters */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="Search by name or email..."
                value={filter.search}
                onChange={handleSearch}
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={filter.role}
                  onChange={handleFilterChange}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="farmer">Farmer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
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
                  >
                    Deactivate ({selectedUsers.length})
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => openDialog('delete', null, true)}
                  >
                    Delete ({selectedUsers.length})
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear
                  </Button>
                </Stack>
              )}

              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setFilter({ role: 'all', status: 'all', search: '' });
                  setPagination(prev => ({ ...prev, page: 0 }));
                  setSelectedUsers([]);
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verification</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Joined</TableCell>
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
                  ) : users.length > 0 ? (
                    users.map(renderUserItem)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No users found
                        </Typography>
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
              {/* User Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
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
                    <Typography variant="body2">
                      <Chip
                        label={selectedUserForView.role}
                        size="small"
                        color={getRoleChipColor(selectedUserForView.role)}
                        icon={getRoleIcon(selectedUserForView.role)}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Typography variant="body2">
                      <Chip
                        label={getStatusLabel(selectedUserForView)}
                        size="small"
                        color={getStatusChipColor(selectedUserForView)}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Verification</Typography>
                    <Typography variant="body2">
                      {selectedUserForView.isVerified ? 'Verified ✅' : 'Not Verified'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Auth Provider</Typography>
                    <Typography variant="body2">
                      {selectedUserForView.authProvider || 'Local'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Joined</Typography>
                    <Typography variant="body2">{formatDate(selectedUserForView.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">User ID</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {selectedUserForView._id}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Contact Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
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
                        `${selectedUserForView.address.street || ''} ${selectedUserForView.address.barangay || ''} ${selectedUserForView.address.city || ''} ${selectedUserForView.address.zipcode || ''}`.trim() || 'Not provided'
                        : 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewUserDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogs */}
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
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Current Role: <strong>{selectedUser?.role}</strong>
              </Typography>
              <FormControl fullWidth>
                <InputLabel>New Role</InputLabel>
                <Select
                  value={dialogData.role}
                  onChange={(e) => setDialogData(prev => ({ ...prev, role: e.target.value }))}
                  label="New Role"
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
                ? `Are you sure you want to deactivate ${selectedUsers.length} user(s)? They will not be able to log in.`
                : `Are you sure you want to deactivate ${selectedUser?.name}? They will not be able to log in.`
              }
            </Typography>
          )}

          {dialogType === 'activate' && (
            <Typography variant="body2" color="success" sx={{ mt: 1 }}>
              Are you sure you want to activate {selectedUser?.name}? They will be able to log in again.
            </Typography>
          )}

          {dialogType === 'delete' && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {actionType === 'bulk'
                ? `Are you sure you want to delete ${selectedUsers.length} user(s)? They will be moved to trash and can be restored.`
                : `Are you sure you want to delete ${selectedUser?.name}? They will be moved to trash and can be restored.`
              }
            </Typography>
          )}

          {dialogType === 'restore' && (
            <Typography variant="body2" color="success" sx={{ mt: 1 }}>
              Are you sure you want to restore {selectedUser?.name}? They will be able to log in again.
            </Typography>
          )}

          {dialogType === 'hardDelete' && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              <strong>WARNING:</strong> Are you sure you want to permanently delete {selectedUser?.name}? 
              This action <strong>CANNOT</strong> be undone and all user data will be lost.
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
            color={
              dialogType === 'hardDelete' || dialogType === 'delete' ? 'error' :
              dialogType === 'deactivate' ? 'warning' :
              dialogType === 'activate' || dialogType === 'restore' ? 'success' :
              'primary'
            }
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

export default ManageUser;