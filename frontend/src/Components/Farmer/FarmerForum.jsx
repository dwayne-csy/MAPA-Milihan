import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import axios from 'axios';
import FarmerHeader from '../layouts/FarmerHeader';

// ── Icons ───────────────────────────────────────────────────────────────
const EditIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ReplyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="10 9 3 9 3 16"/>
    <line x1="3" y1="16" x2="10" y2="16"/>
    <path d="M21 16h-5a5 5 0 0 1-5-5V3"/>
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Helper Functions ──────────────────────────────────────────────────
const getDefaultAvatarColor = (userType) => {
  const colors = {
    'User': 'bg-blue-500',
    'Farmer': 'bg-emerald-600',
    'Admin': 'bg-red-500'
  };
  return colors[userType] || 'bg-gray-500';
};

const getInitial = (name) => {
  if (!name) return 'F';
  return name.charAt(0).toUpperCase();
};

// Helper to compare user IDs safely
const compareUserId = (id1, id2) => {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

const FarmerForum = () => {
  const navigate = useNavigate(); // Add useNavigate hook
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    category: 'General',
    mediaFiles: [] 
  });
  const [commentContent, setCommentContent] = useState('');
  const [commentMediaFiles, setCommentMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentPostId, setEditingCommentPostId] = useState(null);
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMediaFiles, setReplyMediaFiles] = useState([]);
  const [showReplyInput, setShowReplyInput] = useState(null);
  const [reportData, setReportData] = useState({
    reportType: '',
    targetId: '',
    reason: '',
    description: ''
  });
  const [userAvatars, setUserAvatars] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  
  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = typeof userData === 'string' ? JSON.parse(userData) : userData;
        setUser(parsed);
        console.log('👤 User loaded:', parsed);
        console.log('👤 User ID:', parsed.id || parsed._id);
        console.log('👤 User Type:', parsed.userType || parsed.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Function to navigate to user profile
  const navigateToProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // Fetch posts
  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/forums/posts?page=${pageNum}&limit=10`, { headers });
      const postsData = response.data.data;
      
      console.log('📊 Posts data:', postsData.map(p => ({
        id: p._id,
        title: p.title,
        author: p.author,
        userType: p.author?.userType
      })));
      
      setPosts(postsData);
      setTotalPages(response.data.pagination.pages);
      setPage(pageNum);
      
      await fetchAvatarsForPosts(postsData);
    } catch (err) {
      setError('Failed to fetch posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch avatars for users in posts
  const fetchAvatarsForPosts = async (postsData) => {
    if (!postsData || postsData.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const userIds = new Set();
      
      postsData.forEach(post => {
        if (post.author?.userId) userIds.add(post.author.userId);
        if (post.comments) {
          post.comments.forEach(comment => {
            if (comment.author?.userId) userIds.add(comment.author.userId);
          });
        }
      });
      
      const userAvatarsMap = {};
      for (const userId of userIds) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}/avatar`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (response.data?.avatarUrl) {
            userAvatarsMap[userId] = response.data.avatarUrl;
          } else {
            userAvatarsMap[userId] = null;
          }
        } catch (err) {
          userAvatarsMap[userId] = null;
        }
      }
      
      setUserAvatars(prev => ({ ...prev, ...userAvatarsMap }));
    } catch (err) {
      console.error('Error fetching avatars:', err);
    }
  };

  // Fetch single user avatar
  const fetchUserAvatar = async (userId) => {
    if (!userId) return null;
    if (userAvatars[userId] !== undefined) return userAvatars[userId];
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/${userId}/avatar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data?.avatarUrl) {
        setUserAvatars(prev => ({ ...prev, [userId]: response.data.avatarUrl }));
        return response.data.avatarUrl;
      } else {
        setUserAvatars(prev => ({ ...prev, [userId]: null }));
      }
    } catch (err) {
      setUserAvatars(prev => ({ ...prev, [userId]: null }));
    }
    return null;
  };

  // Get user avatar URL
  const getUserAvatarUrl = (author) => {
    if (!author) return null;
    
    if (author.userId && userAvatars[author.userId] !== undefined) {
      return userAvatars[author.userId];
    }
    
    if (author.avatar?.url) {
      return author.avatar.url.startsWith('http') 
        ? author.avatar.url 
        : `${API_BASE_URL}${author.avatar.url}`;
    }
    if (author.profilePicture?.url) {
      return author.profilePicture.url.startsWith('http')
        ? author.profilePicture.url
        : `${API_BASE_URL}${author.profilePicture.url}`;
    }
    
    if (user && author.userId === user.id) {
      if (user.avatar?.url) {
        return user.avatar.url.startsWith('http') 
          ? user.avatar.url 
          : `${API_BASE_URL}${user.avatar.url}`;
      }
      if (user.profilePicture?.url) {
        return user.profilePicture.url.startsWith('http')
          ? user.profilePicture.url
          : `${API_BASE_URL}${user.profilePicture.url}`;
      }
    }
    
    if (author.userId) {
      fetchUserAvatar(author.userId);
    }
    
    return null;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle file selection for post
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv','video/avi'];
      return validImage.includes(file.type) || validVideo.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files.');
      e.target.value = '';
      return;
    }
    
    const largeFiles = validFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (largeFiles.length > 0) {
      if (!window.confirm(`Some files are larger than 10MB. Large videos may take longer to upload. Continue?`)) {
        e.target.value = '';
        return;
      }
    }
    
    setNewPost(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...validFiles]
    }));
    
    e.target.value = '';
  };

  // Remove media from post
  const removeMedia = (index) => {
    setNewPost(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  // Handle comment file selection
  const handleCommentFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv','video/avi'];
      return validImage.includes(file.type) || validVideo.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files.');
      e.target.value = '';
      return;
    }
    
    setCommentMediaFiles([...commentMediaFiles, ...validFiles]);
    e.target.value = '';
  };

  // Remove comment media
  const removeCommentMedia = (index) => {
    setCommentMediaFiles(commentMediaFiles.filter((_, i) => i !== index));
  };

  // Handle reply file selection
  const handleReplyFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv','video/avi'];
      return validImage.includes(file.type) || validVideo.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files.');
      e.target.value = '';
      return;
    }
    
    setReplyMediaFiles([...replyMediaFiles, ...validFiles]);
    e.target.value = '';
  };

  // Remove reply media
  const removeReplyMedia = (index) => {
    setReplyMediaFiles(replyMediaFiles.filter((_, i) => i !== index));
  };

  // Create new post with FormData
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setIsProcessing(true);
      setUploadProgress(0);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to create a post');
        setUploading(false);
        setIsProcessing(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('title', newPost.title.trim());
      formData.append('content', newPost.content.trim());
      formData.append('category', newPost.category);
      
      newPost.mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(`${API_BASE_URL}/api/forums/posts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const displayProgress = Math.min(percentCompleted, 95);
          setUploadProgress(displayProgress);
        }
      });
      
      setUploadProgress(100);
      
      await fetchPosts(page);
      
      setNewPost({ 
        title: '', 
        content: '', 
        category: 'General',
        mediaFiles: [] 
      });
      setShowCreatePost(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError(null);
    } catch (err) {
      console.error('Create post error:', err);
      let errorMessage = 'Failed to create post';
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller video file (under 10MB).';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setIsProcessing(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 3000);
    }
  };

  // Add comment with FormData
  const handleAddComment = async (postId, parentCommentId = null, replyToUserId = null, replyToUserName = null) => {
    if (!commentContent.trim() && commentMediaFiles.length === 0) {
      setError('Please enter a comment or add media');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('content', commentContent);
      if (parentCommentId) formData.append('parentCommentId', parentCommentId);
      if (replyToUserId) formData.append('replyToUserId', replyToUserId);
      if (replyToUserName) formData.append('replyToUserName', replyToUserName);
      
      commentMediaFiles.forEach(file => {
        formData.append('media', file);
      });

      await axios.post(
        `${API_BASE_URL}/api/forums/posts/${postId}/comments`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        }
      );
      
      await fetchPostById(postId);
      
      setCommentContent('');
      setCommentMediaFiles([]);
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = '';
      }
      setShowReplyInput(null);
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    }
  };

  // Fetch single post by ID
  const fetchPostById = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/api/forums/posts/${postId}`, { headers });
      
      const updatedPost = response.data.data;
      
      await fetchAvatarsForPosts([updatedPost]);
      
      setPosts(posts.map(post => 
        post._id === postId ? updatedPost : post
      ));
      
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(updatedPost);
      }
      
      return updatedPost;
    } catch (err) {
      console.error('Failed to fetch post:', err);
      return null;
    }
  };

  // Add reply to comment
  const handleAddReply = async (postId, commentId, replyToUserId, replyToUserName) => {
    if (!replyContent.trim() && replyMediaFiles.length === 0) {
      setError('Please enter a reply or add media');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('content', replyContent);
      formData.append('parentCommentId', commentId);
      formData.append('replyToUserId', replyToUserId);
      formData.append('replyToUserName', replyToUserName);
      
      replyMediaFiles.forEach(file => {
        formData.append('media', file);
      });

      await axios.post(
        `${API_BASE_URL}/api/forums/posts/${postId}/comments`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        }
      );
      
      await fetchPostById(postId);
      
      setReplyContent('');
      setReplyMediaFiles([]);
      setShowReplyInput(null);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to add reply:', err);
      setError('Failed to add reply');
    }
  };

  // Toggle like on post
  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/forums/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, isLiked: response.data.isLiked, likes: post.likes.length + (response.data.isLiked ? 1 : -1) }
          : post
      ));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // Delete post
  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/forums/posts/${postToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosts(posts.filter(post => post._id !== postToDelete));
      setShowDeleteModal(false);
      setPostToDelete(null);
      
      if (selectedPost?._id === postToDelete) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  // Delete comment
  const handleDeleteComment = async () => {
    if (!commentToDelete || !selectedPost) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/forums/posts/${selectedPost._id}/comments/${commentToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchPostById(selectedPost._id);
      
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  // Open delete comment modal
  const openDeleteCommentModal = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  // Close delete comment modal
  const closeDeleteCommentModal = () => {
    setShowDeleteCommentModal(false);
    setCommentToDelete(null);
  };

  // Open edit post modal
  const openEditPostModal = (post) => {
    setEditingPost({
      ...post,
      editTitle: post.title,
      editContent: post.content,
      editCategory: post.category,
      editMediaFiles: [],
      removeMediaIds: []
    });
    setShowEditPostModal(true);
  };

  // Close edit post modal
  const closeEditPostModal = () => {
    setShowEditPostModal(false);
    setEditingPost(null);
  };

  // Handle edit post file selection
  const handleEditFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv','video/avi'];
      return validImage.includes(file.type) || validVideo.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files.');
      e.target.value = '';
      return;
    }
    
    setEditingPost(prev => ({
      ...prev,
      editMediaFiles: [...prev.editMediaFiles, ...validFiles]
    }));
    
    e.target.value = '';
  };

  // Remove edit media
  const removeEditMedia = (index) => {
    setEditingPost(prev => ({
      ...prev,
      editMediaFiles: prev.editMediaFiles.filter((_, i) => i !== index)
    }));
  };

  // Remove existing media from post
  const removeExistingMedia = (publicId) => {
    setEditingPost(prev => ({
      ...prev,
      media: prev.media.filter(m => m.publicId !== publicId),
      removeMediaIds: [...prev.removeMediaIds, publicId]
    }));
  };

  // Handle edit post submit
  const handleEditPost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editingPost.editTitle.trim());
      formData.append('content', editingPost.editContent.trim());
      formData.append('category', editingPost.editCategory);
      
      if (editingPost.removeMediaIds && editingPost.removeMediaIds.length > 0) {
        editingPost.removeMediaIds.forEach(id => {
          formData.append('removeMediaIds[]', id);
        });
      }
      
      editingPost.editMediaFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.put(
        `${API_BASE_URL}/api/forums/posts/${editingPost._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        }
      );

      setPosts(posts.map(post => 
        post._id === editingPost._id ? response.data.data : post
      ));
      
      if (selectedPost && selectedPost._id === editingPost._id) {
        setSelectedPost(response.data.data);
      }

      closeEditPostModal();
    } catch (err) {
      console.error('Failed to update post:', err);
      alert(err.response?.data?.message || 'Failed to update post');
    }
  };

  // Open edit comment modal
  const openEditCommentModal = (postId, comment) => {
    setEditingCommentPostId(postId);
    setEditingComment({
      ...comment,
      editContent: comment.content,
      editMediaFiles: [],
      removeMediaIds: []
    });
    setShowEditCommentModal(true);
  };

  // Close edit comment modal
  const closeEditCommentModal = () => {
    setShowEditCommentModal(false);
    setEditingComment(null);
    setEditingCommentPostId(null);
  };

  // Handle edit comment file selection
  const handleEditCommentFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validImage = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml','image/bmp','image/tiff'];
      const validVideo = ['video/mp4','video/mpeg','video/ogg','video/webm','video/quicktime','video/x-msvideo','video/x-ms-wmv','video/avi'];
      return validImage.includes(file.type) || validVideo.includes(file.type);
    });
    
    if (validFiles.length === 0) {
      alert('Please select valid image or video files.');
      e.target.value = '';
      return;
    }
    
    setEditingComment(prev => ({
      ...prev,
      editMediaFiles: [...prev.editMediaFiles, ...validFiles]
    }));
    
    e.target.value = '';
  };

  // Remove edit comment media
  const removeEditCommentMedia = (index) => {
    setEditingComment(prev => ({
      ...prev,
      editMediaFiles: prev.editMediaFiles.filter((_, i) => i !== index)
    }));
  };

  // Remove existing comment media
  const removeExistingCommentMedia = (publicId) => {
    setEditingComment(prev => ({
      ...prev,
      media: prev.media.filter(m => m.publicId !== publicId),
      removeMediaIds: [...prev.removeMediaIds, publicId]
    }));
  };

  // Handle edit comment submit
  const handleEditComment = async (e) => {
    e.preventDefault();
    if (!editingComment || !editingCommentPostId) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', editingComment.editContent.trim());
      
      if (editingComment.removeMediaIds && editingComment.removeMediaIds.length > 0) {
        editingComment.removeMediaIds.forEach(id => {
          formData.append('removeMediaIds[]', id);
        });
      }
      
      editingComment.editMediaFiles.forEach(file => {
        formData.append('media', file);
      });

      await axios.put(
        `${API_BASE_URL}/api/forums/posts/${editingCommentPostId}/comments/${editingComment._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        }
      );

      await fetchPostById(editingCommentPostId);
      
      closeEditCommentModal();
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert(err.response?.data?.message || 'Failed to update comment');
    }
  };

  // Open report modal
  const openReportModal = (type, targetId) => {
    setReportData({
      reportType: type,
      targetId: targetId,
      reason: '',
      description: ''
    });
    setShowReportModal(true);
  };

  // Close report modal
  const closeReportModal = () => {
    setShowReportModal(false);
    setReportData({
      reportType: '',
      targetId: '',
      reason: '',
      description: ''
    });
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportData.reason) {
      alert('Please select a reason for reporting');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/forums/posts/${reportData.targetId}/report`, 
        { 
          reason: reportData.reason,
          description: reportData.description 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Report submitted successfully');
      closeReportModal();
    } catch (err) {
      console.error('Failed to submit report:', err);
      alert('Failed to submit report');
    }
  };

  // Render media
  const renderMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-4">
        {mediaItems.map((media, index) => {
          const isVideo = media.type === 'video' || 
                         (media.url && media.url.includes('/video/upload/')) ||
                         (media.url && (media.url.endsWith('.mp4') || media.url.endsWith('.webm')));
          
          const mediaUrl = media.url || media.preview;
          
          return (
            <div key={index} className="rounded-lg overflow-hidden bg-gray-100">
              {isVideo ? (
                <div className="relative bg-black">
                  <video 
                    controls 
                    className="w-full max-h-[400px]"
                    preload="metadata"
                    playsInline
                    controlsList="nodownload"
                  >
                    <source src={mediaUrl} type="video/mp4" />
                    <source src={mediaUrl} type="video/webm" />
                    <source src={mediaUrl} type="video/ogg" />
                    <p className="text-white p-4 text-center">
                      Your browser does not support the video tag.
                      <br />
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 underline hover:text-blue-300">
                        Click here to open video directly
                      </a>
                    </p>
                  </video>
                </div>
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={`Media ${index + 1}`}
                  className="w-full h-[250px] object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    if (media.preview && e.target.src !== media.preview) {
                      e.target.src = media.preview;
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Build comment tree
  const buildCommentTree = (comments) => {
    if (!comments || comments.length === 0) return [];
    
    const commentMap = {};
    const rootComments = [];
    
    comments.forEach(comment => {
      const id = comment._id || comment.createdAt;
      commentMap[id] = { ...comment, replies: [] };
    });
    
    comments.forEach(comment => {
      const id = comment._id || comment.createdAt;
      if (comment.parentCommentId && commentMap[comment.parentCommentId]) {
        commentMap[comment.parentCommentId].replies.push(commentMap[id]);
      } else {
        rootComments.push(commentMap[id]);
      }
    });
    
    rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    Object.values(commentMap).forEach(comment => {
      comment.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    return rootComments;
  };

  // Toggle comment replies visibility
  const toggleCommentReplies = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Render comment with nested replies
  const renderCommentTree = (post, comment, depth = 0) => {
    const userId = user?.id || user?._id;
    const commentAuthorId = comment.author?.userId;
    const postAuthorId = post.author?.userId;
    
    const isCommentAuthor = userId && commentAuthorId && compareUserId(userId, commentAuthorId);
    const isPostOwner = userId && postAuthorId && compareUserId(userId, postAuthorId);
    const canDeleteComment = isPostOwner || isCommentAuthor || user?.userType === 'Admin' || user?.role === 'Admin';
    
    const isReply = depth > 0;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments[comment._id] !== undefined ? expandedComments[comment._id] : true;
    
    const avatarUrl = getUserAvatarUrl(comment.author);
    const avatarColor = getDefaultAvatarColor(comment.author?.userType || 'User');
    
    return (
      <div key={comment._id || comment.createdAt} className={`${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
        <div className="flex gap-3">
          {/* Comment Avatar - Clickable */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigateToProfile(comment.author?.userId)}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={comment.author.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const initial = getInitial(comment.author.name);
                  const color = getDefaultAvatarColor(comment.author?.userType || 'User');
                  parent.className = `w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`;
                  parent.textContent = initial;
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${avatarColor}`}>
                {getInitial(comment.author.name)}
              </div>
            )}
          </div>
          
          <div className="flex-1 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Comment Author Name - Clickable */}
                <strong 
                  className="text-sm text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigateToProfile(comment.author?.userId)}
                >
                  {comment.author.name}
                </strong>
                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                {comment.author.userType === 'Admin' && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Admin</span>
                )}
                {comment.author.userType === 'Farmer' && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Farmer</span>
                )}
                {isPostOwner && !isCommentAuthor && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Post Owner</span>
                )}
                {comment.replyToUserName && (
                  <span className="text-xs text-gray-500">
                    Replying to <span className="text-blue-600">@{comment.replyToUserName}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isCommentAuthor && (
                  <button
                    onClick={() => openEditCommentModal(post._id, comment)}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                    title="Edit comment"
                  >
                    <EditIcon size={14} />
                  </button>
                )}
                {canDeleteComment && (
                  <button
                    onClick={() => openDeleteCommentModal(comment._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 flex items-center gap-1"
                    title="Delete comment"
                  >
                    <TrashIcon size={14} />
                    <span className="text-xs">Delete</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{comment.content}</p>
            {comment.media && comment.media.length > 0 && (
              <div className="mt-2">
                {renderMedia(comment.media)}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-4">
              <button 
                onClick={() => {
                  setShowReplyInput({
                    postId: post._id,
                    commentId: comment._id,
                    userId: comment.author.userId,
                    userName: comment.author.name
                  });
                }}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
              >
                <ReplyIcon size={12} /> Reply
              </button>
              {hasReplies && (
                <button 
                  onClick={() => toggleCommentReplies(comment._id)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  {isExpanded ? `Hide ${comment.replies.length} replies` : `Show ${comment.replies.length} replies`}
                </button>
              )}
              <button 
                onClick={() => openReportModal('comment', comment._id)}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors"
              >
                Report
              </button>
            </div>
            
            {/* Reply input for this comment */}
            {showReplyInput && showReplyInput.commentId === comment._id && showReplyInput.postId === post._id && (
              <div className="mt-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden">
                    {getUserAvatarUrl(user) ? (
                      <img 
                        src={getUserAvatarUrl(user)} 
                        alt={user?.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          const initial = getInitial(user?.name);
                          const color = getDefaultAvatarColor(user?.userType || 'User');
                          parent.className = `w-7 h-7 rounded-full ${color} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`;
                          parent.textContent = initial;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${getDefaultAvatarColor(user?.userType || 'User')}`}>
                        {getInitial(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Reply to ${comment.author.name}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddReply(
                            post._id,
                            comment._id,
                            comment.author.userId,
                            comment.author.name
                          );
                        }
                        if (e.key === 'Escape') {
                          setShowReplyInput(null);
                          setReplyContent('');
                          setReplyMediaFiles([]);
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleAddReply(
                        post._id,
                        comment._id,
                        comment.author.userId,
                        comment.author.name
                      )}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium text-sm transition-colors whitespace-nowrap"
                    >
                      Reply
                    </button>
                    <button 
                      onClick={() => {
                        setShowReplyInput(null);
                        setReplyContent('');
                        setReplyMediaFiles([]);
                        if (replyFileInputRef.current) {
                          replyFileInputRef.current.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-sm transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {replyMediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-9">
                    {replyMediaFiles.map((media, index) => (
                      <div key={index} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                        {media.type.startsWith('video/') ? (
                          <video className="w-full h-full object-cover bg-black">
                            <source src={URL.createObjectURL(media)} />
                          </video>
                        ) : (
                          <img src={URL.createObjectURL(media)} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeReplyMedia(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-1 ml-9">
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleReplyFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Render replies recursively */}
        {hasReplies && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {comment.replies.map(reply => renderCommentTree(post, reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <FarmerHeader />
      
      <div className="flex-1 max-w-4xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Farmer Community Forum</h1>
        
        {/* Create Post */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {getUserAvatarUrl(user) ? (
                <img 
                  src={getUserAvatarUrl(user)} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    const initial = getInitial(user.name);
                    const color = getDefaultAvatarColor(user.userType || 'Farmer');
                    parent.className = `w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`;
                    parent.textContent = initial;
                  }}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${getDefaultAvatarColor(user.userType || 'Farmer')}`}>
                  {getInitial(user.name)}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="flex-1 text-left px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              What's on your mind, {user?.name?.split(' ')[0] || 'Farmer'}?
            </button>
          </div>
          
          {showCreatePost && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <form onSubmit={handleCreatePost} className="space-y-4" encType="multipart/form-data">
                <input
                  type="text"
                  placeholder="Title *"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-y"
                  required
                />
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="General">General</option>
                  <option value="Farming Tips">Farming Tips</option>
                  <option value="Crops">Crops</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Market">Market</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload images or videos (max 100MB each)</p>
                </div>

                {(uploading || isProcessing) && uploadProgress > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{uploadProgress < 100 ? 'Uploading...' : 'Processing...'}</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${uploadProgress >= 100 ? 'bg-green-500' : 'bg-emerald-500'}`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {newPost.mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {newPost.mediaFiles.map((media, index) => (
                      <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {media.type.startsWith('video/') ? (
                          <video className="w-full h-[100px] bg-black object-cover">
                            <source src={URL.createObjectURL(media)} />
                          </video>
                        ) : (
                          <img src={URL.createObjectURL(media)} alt={`Preview ${index + 1}`} className="w-full h-[100px] object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          disabled={uploading}
                        >
                          ×
                        </button>
                        {media.size > 10 * 1024 * 1024 && media.type.startsWith('video/') && (
                          <span className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                            Large File
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPost({ 
                        title: '', 
                        content: '', 
                        category: 'General',
                        mediaFiles: [] 
                      });
                      setUploadProgress(0);
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploading || isProcessing}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                      (uploading || isProcessing) ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {(uploading || isProcessing) ? (uploadProgress < 100 ? 'Uploading...' : 'Processing...') : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading posts...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          {posts.map(post => {
            const userId = user?.id || user?._id;
            const postAuthorId = post.author?.userId;
            const isPostOwner = userId && postAuthorId && compareUserId(userId, postAuthorId);
            
            const postAvatarUrl = getUserAvatarUrl(post.author);
            const postAvatarColor = getDefaultAvatarColor(post.author?.userType || 'User');
            
            const userTypeDisplay = post.author?.userType || 'User';
            
            return (
              <div key={post._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                  {/* Post Author Avatar - Clickable */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigateToProfile(post.author?.userId)}
                  >
                    {postAvatarUrl ? (
                      <img 
                        src={postAvatarUrl} 
                        alt={post.author.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          const initial = getInitial(post.author.name);
                          const color = getDefaultAvatarColor(post.author?.userType || 'User');
                          parent.className = `w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`;
                          parent.textContent = initial;
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${postAvatarColor}`}>
                        {getInitial(post.author.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {/* Post Author Name - Clickable */}
                    <p 
                      className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => navigateToProfile(post.author?.userId)}
                    >
                      {post.author.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={userTypeDisplay === 'Farmer' ? 'text-emerald-600 font-medium' : ''}>
                        {userTypeDisplay}
                      </span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    {isPostOwner && (
                      <>
                        <button
                          onClick={() => openEditPostModal(post)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                          title="Edit post"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(post._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete post"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* DISPLAY TITLE */}
                {post.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h3>
                )}
                
                <p className="text-gray-700 leading-relaxed mb-3">{post.content}</p>
                
                {post.media && post.media.length > 0 && (
                  <div className="mb-4">
                    {renderMedia(post.media)}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleLikePost(post._id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors text-sm ${
                      post.isLiked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span>{post.isLiked ? '❤️' : '🤍'}</span>
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => setSelectedPost(selectedPost?._id === post._id ? null : post)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <span>💬</span>
                    <span>{post.comments?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => openReportModal('post', post._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600"
                  >
                    <span>🚩</span>
                    <span>Report</span>
                  </button>
                </div>

                {selectedPost?._id === post._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">Comments</h4>
                    
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-1">
                        {buildCommentTree(post.comments).map(comment => renderCommentTree(post, comment))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                    )}
                    
                    {/* Add new comment */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 overflow-hidden">
                        {getUserAvatarUrl(user) ? (
                          <img 
                            src={getUserAvatarUrl(user)} 
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              const initial = getInitial(user.name);
                              const color = getDefaultAvatarColor(user.userType || 'Farmer');
                              parent.className = `w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`;
                              parent.textContent = initial;
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${getDefaultAvatarColor(user.userType || 'Farmer')}`}>
                            {getInitial(user.name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post._id);
                            }
                          }}
                        />
                        <button 
                          onClick={() => handleAddComment(post._id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                    {commentMediaFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-11">
                        {commentMediaFiles.map((media, index) => (
                          <div key={index} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                            {media.type.startsWith('video/') ? (
                              <video className="w-full h-full object-cover bg-black">
                                <source src={URL.createObjectURL(media)} />
                              </video>
                            ) : (
                              <img src={URL.createObjectURL(media)} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button 
                              type="button"
                              onClick={() => removeCommentMedia(index)}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 ml-11">
                      <input
                        ref={commentFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleCommentFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => fetchPosts(pageNum)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  page === pageNum 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Post Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDeleteModal}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={closeDeleteModal} 
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeletePost} 
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation Modal */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDeleteCommentModal}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={closeDeleteCommentModal} 
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteComment} 
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditPostModal && editingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeEditPostModal}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Edit Post</h3>
              <button onClick={closeEditPostModal} className="text-gray-400 hover:text-gray-600">
                <CloseIcon size={24} />
              </button>
            </div>
            <form onSubmit={handleEditPost} className="space-y-4" encType="multipart/form-data">
              <input
                type="text"
                placeholder="Title *"
                value={editingPost.editTitle || ''}
                onChange={(e) => setEditingPost({ ...editingPost, editTitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="Content"
                value={editingPost.editContent || ''}
                onChange={(e) => setEditingPost({ ...editingPost, editContent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[100px] resize-y"
                required
              />
              <select
                value={editingPost.editCategory || 'General'}
                onChange={(e) => setEditingPost({ ...editingPost, editCategory: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="General">General</option>
                <option value="Farming Tips">Farming Tips</option>
                <option value="Crops">Crops</option>
                <option value="Livestock">Livestock</option>
                <option value="Market">Market</option>
                <option value="Equipment">Equipment</option>
                <option value="Other">Other</option>
              </select>

              {editingPost.media && editingPost.media.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Media</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {editingPost.media.map((media, index) => (
                      <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {media.type === 'video' ? (
                          <video className="w-full h-[80px] bg-black object-cover">
                            <source src={media.url} />
                          </video>
                        ) : (
                          <img src={media.url} alt={`Media ${index + 1}`} className="w-full h-[80px] object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeExistingMedia(media.publicId)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEditFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">Upload additional images or videos</p>
              </div>

              {editingPost.editMediaFiles && editingPost.editMediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {editingPost.editMediaFiles.map((media, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                      {media.type.startsWith('video/') ? (
                        <video className="w-full h-[80px] bg-black object-cover">
                          <source src={URL.createObjectURL(media)} />
                        </video>
                      ) : (
                        <img src={URL.createObjectURL(media)} alt={`Preview ${index + 1}`} className="w-full h-[80px] object-cover" />
                      )}
                      <button 
                        type="button"
                        onClick={() => removeEditMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeEditPostModal} 
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Comment Modal */}
      {showEditCommentModal && editingComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeEditCommentModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Edit Comment</h3>
              <button onClick={closeEditCommentModal} className="text-gray-400 hover:text-gray-600">
                <CloseIcon size={24} />
              </button>
            </div>
            <form onSubmit={handleEditComment} className="space-y-4">
              <textarea
                placeholder="Comment content"
                value={editingComment.editContent || ''}
                onChange={(e) => setEditingComment({ ...editingComment, editContent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[80px] resize-y"
                required
              />

              {editingComment.media && editingComment.media.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Media</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {editingComment.media.map((media, index) => (
                      <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                        {media.type === 'video' ? (
                          <video className="w-full h-[60px] bg-black object-cover">
                            <source src={media.url} />
                          </video>
                        ) : (
                          <img src={media.url} alt={`Media ${index + 1}`} className="w-full h-[60px] object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeExistingCommentMedia(media.publicId)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEditCommentFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {editingComment.editMediaFiles && editingComment.editMediaFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {editingComment.editMediaFiles.map((media, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden">
                      {media.type.startsWith('video/') ? (
                        <video className="w-full h-[60px] bg-black object-cover">
                          <source src={URL.createObjectURL(media)} />
                        </video>
                      ) : (
                        <img src={URL.createObjectURL(media)} alt={`Preview ${index + 1}`} className="w-full h-[60px] object-cover" />
                      )}
                      <button 
                        type="button"
                        onClick={() => removeEditCommentMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeEditCommentModal} 
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeReportModal}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Report Content</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitReport(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for reporting *</label>
                <select
                  value={reportData.reason}
                  onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="False Information">False Information</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional details (optional)</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  placeholder="Provide more details about your report..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[80px] resize-y"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeReportModal} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerForum;