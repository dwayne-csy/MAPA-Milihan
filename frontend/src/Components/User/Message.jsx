// Mapa-Milihan/frontend/src/Components/User/Message.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiSend, 
  FiPaperclip, 
  FiImage, 
  FiVideo, 
  FiMic, 
  FiFile,
  FiMoreVertical,
  FiTrash2,
  FiFlag,
  FiHeart,
  FiSmile,
  FiPhone,
  FiVideo as FiVideoCall,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiSearch,
  FiUser,
  FiUserX,
  FiUserCheck,
  FiMessageCircle
} from 'react-icons/fi';
import { FaHeart, FaRegHeart, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow, format } from 'date-fns';

const UserMessage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Get current user ID from token
  const getCurrentUserId = () => {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id;
    } catch (error) {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user data - FIXED ENDPOINT
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Try the correct endpoint for getting current user
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.user) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // Try alternative endpoint
        try {
          const altResponse = await axios.get(`${API_BASE_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (altResponse.data.data?.user) {
            setCurrentUser(altResponse.data.data.user);
          }
        } catch (altError) {
          console.error('Alternative user fetch also failed:', altError);
        }
      }
    };
    fetchCurrentUser();
  }, [API_BASE_URL, token]);

  // Select conversation
  const selectConversation = useCallback((conversation) => {
    console.log('Selecting conversation:', conversation._id);
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    setReplyingTo(null);
    setMediaFiles([]);
    setNewMessage('');
    setShowMobileConversations(false);
  }, []);

  // Create conversation with a specific user - FIXED ENDPOINT
  const createConversationWithUser = useCallback(async (targetUserId) => {
    if (isCreatingConversation) return;
    
    console.log('Creating conversation with user:', targetUserId);
    setIsCreatingConversation(true);
    
    try {
      // First, get user details - using profile endpoint
      const userResponse = await axios.get(`${API_BASE_URL}/api/profile/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User response:', userResponse.data);
      
      if (userResponse.data.success) {
        const userData = userResponse.data.data.user;
        
        // Send a message to create the conversation
        const response = await axios.post(
          `${API_BASE_URL}/api/messages/send`,
          {
            receiverId: targetUserId,
            receiverType: userData.userType || 'User',
            receiverName: userData.name,
            content: `👋 Hello! Let's start chatting.`
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            }
          }
        );

        console.log('Message sent response:', response.data);
        
        // Wait a bit for the conversation to be created in the database
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch fresh conversations
        const convResponse = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Fresh conversations:', convResponse.data.data);
        
        // Update conversations state
        setConversations(convResponse.data.data);
        
        // Find the new conversation
        const newConv = convResponse.data.data.find(
          conv => conv.otherParticipant?.userId?._id === targetUserId
        );
        
        if (newConv) {
          console.log('New conversation found:', newConv._id);
          selectConversation(newConv);
          
          const counts = {};
          convResponse.data.data.forEach(conv => {
            counts[conv._id] = conv.unreadCount || 0;
          });
          setUnreadCounts(counts);
          
          toast.success('Conversation started!');
        } else {
          console.log('New conversation not found after creation');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const retryConv = retryResponse.data.data.find(
            conv => conv.otherParticipant?.userId?._id === targetUserId
          );
          
          if (retryConv) {
            console.log('Found conversation on retry:', retryConv._id);
            setConversations(retryResponse.data.data);
            selectConversation(retryConv);
            
            const counts = {};
            retryResponse.data.data.forEach(conv => {
              counts[conv._id] = conv.unreadCount || 0;
            });
            setUnreadCounts(counts);
            
            toast.success('Conversation started!');
          } else {
            toast.error('Could not create conversation. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Could not start conversation with this user');
    } finally {
      setIsCreatingConversation(false);
    }
  }, [API_BASE_URL, token, selectConversation, isCreatingConversation]);

  // Fetch conversations - FIXED ENDPOINT
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched conversations:', response.data.data);
      setConversations(response.data.data);
      
      // Calculate unread counts
      const counts = {};
      response.data.data.forEach(conv => {
        counts[conv._id] = conv.unreadCount || 0;
      });
      setUnreadCounts(counts);

      // If userId is in URL, find or create conversation with that user
      if (userId && !isCreatingConversation) {
        console.log('Looking for conversation with userId:', userId);
        
        const existingConv = response.data.data.find(
          conv => conv.otherParticipant?.userId?._id === userId
        );
        
        if (existingConv) {
          console.log('Found existing conversation:', existingConv._id);
          selectConversation(existingConv);
        } else {
          console.log('No existing conversation, creating new one...');
          await createConversationWithUser(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token, userId, selectConversation, createConversationWithUser, isCreatingConversation]);

  // Fetch messages for a conversation - FIXED ENDPOINT
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.data.messages || []);
      
      if (response.data.data.markedAsRead > 0) {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: 0
        }));
        setConversations(prev => prev.map(conv => 
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [API_BASE_URL, token]);

  // Initialize WebSocket
  useEffect(() => {
    if (!token) return;

    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/messages?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data.type);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setTimeout(() => {
        setWs(null);
      }, 3000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [API_BASE_URL, token]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'new_message':
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => [...prev, data.message]);
          markAsRead(data.conversationId);
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || 0) + 1
          }));
          fetchConversations();
        }
        break;

      case 'read_receipt':
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
          ));
        }
        break;

      case 'typing':
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setIsTyping(data.isTyping && data.userId !== currentUserId);
        }
        break;

      case 'user_online':
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: data.isOnline
        }));
        break;

      case 'online_users':
        // Handle list of online users
        if (data.users) {
          const onlineMap = {};
          data.users.forEach(userId => {
            onlineMap[userId] = true;
          });
          setOnlineUsers(onlineMap);
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Mark messages as read - FIXED ENDPOINT
  const markAsRead = async (conversationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send message - FIXED ENDPOINT
  const sendMessage = async () => {
    if (!newMessage.trim() && mediaFiles.length === 0) return;
    if (!selectedConversation) return;

    setSending(true);
    
    const formData = new FormData();
    const otherParticipant = selectedConversation.otherParticipant;
    
    formData.append('receiverId', otherParticipant.userId._id);
    formData.append('receiverType', otherParticipant.userType);
    formData.append('receiverName', otherParticipant.name);
    formData.append('content', newMessage);
    
    if (replyingTo) {
      formData.append('replyToMessageId', replyingTo._id);
    }

    mediaFiles.forEach(file => {
      formData.append('media', file);
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/messages/send`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNewMessage('');
      setMediaFiles([]);
      setReplyingTo(null);
      
      const sentMessage = response.data.data.messages[response.data.data.messages.length - 1];
      setMessages(prev => [...prev, sentMessage]);
      fetchConversations();

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversationId: selectedConversation._id,
          isTyping: false
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });
    setMediaFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  // Remove media file
  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Delete message - FIXED ENDPOINT
  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${messageId}`,
        {
          data: { deleteForEveryone },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (deleteForEveryone) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isDeleted: true } : msg
        ));
      }
      setShowOptions(false);
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Add reaction - FIXED ENDPOINT
  const addReaction = async (messageId, reaction) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${messageId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.userId === currentUserId);
          if (existingReaction) {
            if (existingReaction.reaction === reaction) {
              return {
                ...msg,
                reactions: msg.reactions.filter(r => r.userId !== currentUserId)
              };
            } else {
              return {
                ...msg,
                reactions: msg.reactions.map(r => 
                  r.userId === currentUserId ? { ...r, reaction } : r
                )
              };
            }
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { userId: currentUserId, reaction }]
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Block user - FIXED ENDPOINT
  const blockUser = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/block`,
        {
          userId: selectedConversation.otherParticipant.userId._id,
          userType: selectedConversation.otherParticipant.userType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBlockConfirm(false);
      toast.success('User blocked successfully');
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  // Unblock user - FIXED ENDPOINT
  const unblockUser = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/unblock`,
        {
          userId: selectedConversation.otherParticipant.userId._id,
          userType: selectedConversation.otherParticipant.userType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('User unblocked successfully');
      fetchConversations();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  // Report message - FIXED ENDPOINT
  const reportMessage = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${selectedMessage._id}/report`,
        {
          reason: reportReason,
          description: reportDescription
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      toast.success('Message reported successfully');
    } catch (error) {
      console.error('Error reporting message:', error);
      toast.error('Failed to report message');
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (ws && ws.readyState === WebSocket.OPEN && selectedConversation) {
      ws.send(JSON.stringify({
        type: 'typing',
        conversationId: selectedConversation._id,
        isTyping: true
      }));
    }

    const timeout = setTimeout(() => {
      if (ws && ws.readyState === WebSocket.OPEN && selectedConversation) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversationId: selectedConversation._id,
          isTyping: false
        }));
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Handle key press for sending message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const name = conv.otherParticipant?.name?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase());
  });

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Check if current user is message sender
  const isSender = (message) => {
    return message.senderId === currentUserId;
  };

  // Get user initials
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  // Get user role badge
  const getRoleBadge = (userType) => {
    switch(userType) {
      case 'Farmer':
        return <span className="role-badge farmer">🌾 Farmer</span>;
      case 'Admin':
        return <span className="role-badge admin">⚙️ Admin</span>;
      default:
        return <span className="role-badge user">👤 User</span>;
    }
  };

  // Get user online status
  const isUserOnline = (userId) => {
    return onlineUsers[userId] || false;
  };

  // Handle back to conversations
  const handleBackToConversations = () => {
    setShowMobileConversations(true);
    setSelectedConversation(null);
    setMessages([]);
  };

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // The rest of the JSX remains the same...
  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="messages-layout bg-white rounded-xl shadow-md overflow-hidden">
          {/* Conversations List */}
          <div className={`conversations-list ${showMobileConversations ? 'visible' : 'hidden'}`}>
            <div className="conversations-header">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                <FiMessageCircle className="text-green-500" />
                Messages
              </h2>
              <div className="search-box">
                <FiSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-700"
                />
              </div>
            </div>

            <div className="conversations-scroll">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                  <p className="mt-3">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiMessageCircle className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p>No conversations yet</p>
                  <small className="text-gray-400">Start messaging by connecting with users</small>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const other = conv.otherParticipant;
                  const lastMsg = conv.lastMessage;
                  const unread = unreadCounts[conv._id] || 0;
                  const isOnline = isUserOnline(other?.userId?._id);

                  return (
                    <div
                      key={conv._id}
                      className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="conversation-avatar">
                        {other?.userId?.avatar ? (
                          <img src={other.userId.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="avatar-placeholder">
                            {getInitials(other?.name)}
                          </div>
                        )}
                        <div className={`online-dot ${isOnline ? 'online' : 'offline'}`}></div>
                        {conv.isBlocked && (
                          <div className="blocked-badge">
                            <FiUserX className="text-xs" />
                          </div>
                        )}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-name">
                          <span className="font-medium text-gray-800">{other?.name || 'Unknown User'}</span>
                          {unread > 0 && <span className="unread-badge">{unread}</span>}
                        </div>
                        <div className="conversation-last-message">
                          {lastMsg?.content || 'No messages yet'}
                          {lastMsg?.mediaType && (
                            <span className="media-indicator">
                              {lastMsg.mediaType === 'image' && ' 📷'}
                              {lastMsg.mediaType === 'video' && ' 🎥'}
                              {lastMsg.mediaType === 'audio' && ' 🎵'}
                              {lastMsg.mediaType === 'document' && ' 📄'}
                            </span>
                          )}
                        </div>
                        <div className="conversation-meta">
                          <span className="conversation-time">
                            {lastMsg?.createdAt && formatTimestamp(lastMsg.createdAt)}
                          </span>
                          {getRoleBadge(other?.userType)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div className="chat-area flex flex-col">
              {/* Chat Header */}
              <div className="chat-header">
                <button 
                  className="back-btn"
                  onClick={handleBackToConversations}
                >
                  <FiArrowLeft className="text-xl" />
                </button>
                <div className="chat-user-info">
                  <div className="user-avatar">
                    {selectedConversation.otherParticipant?.userId?.avatar ? (
                      <img src={selectedConversation.otherParticipant.userId.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="avatar-placeholder small">
                        {getInitials(selectedConversation.otherParticipant?.name)}
                      </div>
                    )}
                    <div className={`online-dot small ${isUserOnline(selectedConversation.otherParticipant?.userId?._id) ? 'online' : 'offline'}`}></div>
                  </div>
                  <div>
                    <div className="user-name">
                      {selectedConversation.otherParticipant?.name}
                      {getRoleBadge(selectedConversation.otherParticipant?.userType)}
                    </div>
                    <div className="user-status">
                      {selectedConversation.isBlocked ? (
                        <span className="blocked-text flex items-center gap-1">
                          <FiUserX className="text-xs" /> Blocked
                        </span>
                      ) : isTyping ? (
                        <span className="typing-text">Typing...</span>
                      ) : isUserOnline(selectedConversation.otherParticipant?.userId?._id) ? (
                        <span className="online-text">● Online</span>
                      ) : (
                        <span className="offline-text">● Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="chat-actions">
                  <button 
                    className="action-btn danger"
                    onClick={() => setShowBlockConfirm(true)}
                    title={selectedConversation.isBlocked ? "Unblock User" : "Block User"}
                  >
                    {selectedConversation.isBlocked ? <FiUserCheck /> : <FiUserX />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FiMessageCircle className="text-5xl text-gray-300 mb-3" />
                    <p>No messages yet</p>
                    <small className="text-gray-400">Start a conversation with {selectedConversation.otherParticipant?.name}</small>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      if (msg.isDeleted && msg.deletedFor?.some(d => d.userId === currentUserId)) {
                        return null;
                      }

                      const isMyMessage = isSender(msg);
                      const showAvatar = !isMyMessage && (
                        index === 0 || 
                        messages[index - 1]?.senderId !== msg.senderId
                      );

                      return (
                        <div
                          key={msg._id}
                          className={`message-wrapper ${isMyMessage ? 'own' : 'other'}`}
                        >
                          {!isMyMessage && showAvatar && (
                            <div className="message-avatar">
                              {selectedConversation.otherParticipant?.userId?.avatar ? (
                                <img src={selectedConversation.otherParticipant.userId.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="avatar-placeholder small">
                                  {getInitials(selectedConversation.otherParticipant?.name)}
                                </div>
                              )}
                            </div>
                          )}
                          {!isMyMessage && !showAvatar && (
                            <div className="message-avatar-spacer"></div>
                          )}
                          <div className="message-content">
                            {msg.replyTo && (
                              <div className="reply-preview">
                                <div className="reply-sender">{msg.replyTo.senderName}</div>
                                <div className="reply-text">{msg.replyTo.content}</div>
                              </div>
                            )}
                            <div className="message-bubble">
                              {msg.content && <div className="message-text">{msg.content}</div>}
                              {msg.media && msg.media.length > 0 && (
                                <div className="message-media">
                                  {msg.media.map((media, idx) => (
                                    <div key={idx} className="media-item">
                                      {media.type === 'image' && (
                                        <img 
                                          src={media.url} 
                                          alt="Media" 
                                          onClick={() => window.open(media.url, '_blank')}
                                          loading="lazy"
                                          className="cursor-pointer"
                                        />
                                      )}
                                      {media.type === 'video' && (
                                        <video controls className="w-full max-h-64 rounded-lg">
                                          <source src={media.url} type={media.mimetype} />
                                        </video>
                                      )}
                                      {media.type === 'audio' && (
                                        <audio controls className="w-48">
                                          <source src={media.url} type={media.mimetype} />
                                        </audio>
                                      )}
                                      {media.type === 'document' && (
                                        <a 
                                          href={media.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="document-link"
                                        >
                                          <FiFile /> {media.fileName || 'Document'}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="message-footer">
                              <span className="message-time">
                                {formatTimestamp(msg.createdAt)}
                              </span>
                              {isMyMessage && (
                                <span className="message-status">
                                  {msg.isRead ? (
                                    <FiCheckCircle className="read" title="Read" />
                                  ) : (
                                    <FiCheck className="delivered" title="Delivered" />
                                  )}
                                </span>
                              )}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="message-reactions">
                                  {msg.reactions.map((r, idx) => (
                                    <span key={idx} className="reaction" title={`${r.userId} reacted`}>
                                      {r.reaction}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <button
                                className="message-actions-btn"
                                onClick={() => {
                                  setSelectedMessage(msg);
                                  setShowOptions(true);
                                }}
                              >
                                <FiMoreVertical />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              {!selectedConversation.isBlocked ? (
                <div className="message-input-area p-4 bg-white border-t border-gray-200">
                  {replyingTo && (
                    <div className="reply-bar">
                      <div className="reply-info">
                        <span className="text-sm text-gray-600">Replying to {replyingTo.senderName}</span>
                        <span className="reply-content text-sm font-medium text-gray-800 block">{replyingTo.content}</span>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500">
                        <FiX />
                      </button>
                    </div>
                  )}
                  {mediaFiles.length > 0 && (
                    <div className="media-preview">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="media-preview-item">
                          {file.type.startsWith('image/') && (
                            <img src={URL.createObjectURL(file)} alt="Preview" />
                          )}
                          {file.type.startsWith('video/') && (
                            <video src={URL.createObjectURL(file)} />
                          )}
                          <span className="file-name">{file.name}</span>
                          <button onClick={() => removeMediaFile(index)}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-wrapper">
                    <button
                      className="input-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Emoji"
                    >
                      <FiSmile />
                    </button>
                    <button
                      className="input-btn"
                      onClick={() => fileInputRef.current.click()}
                      title="Attach file"
                    >
                      <FiPaperclip />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      style={{ display: 'none' }}
                    />
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="message-input"
                      ref={messageInputRef}
                    />
                    <button
                      className="send-btn"
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && mediaFiles.length === 0) || sending}
                    >
                      {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiSend />}
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="emoji-picker-wrapper">
                      <EmojiPicker
                        onEmojiClick={(emoji) => {
                          setNewMessage(prev => prev + emoji.emoji);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="blocked-message p-6 text-center text-gray-600 bg-gray-50 border-t border-gray-200">
                  <FiUserX className="text-5xl text-red-400 mx-auto mb-3" />
                  <p className="font-medium text-gray-800">You have blocked this user</p>
                  <p className="text-sm text-gray-500 mt-1">You won't receive messages from them</p>
                  <button onClick={unblockUser} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Unblock User
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-chat flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
              <FiMessageCircle className="text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">Your Messages</h3>
              <p className="text-gray-400 mt-1">Select a conversation to start messaging</p>
              <div className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                💡 Connect with users to start chatting
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals... (same as before) */}
      {showOptions && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Message Options</h3>
            <div className="modal-options">
              <button onClick={() => {
                setReplyingTo(selectedMessage);
                setShowOptions(false);
                messageInputRef.current?.focus();
              }}>
                <FiMessageCircle /> Reply
              </button>
              {isSender(selectedMessage) && (
                <>
                  <button onClick={() => deleteMessage(selectedMessage._id, false)}>
                    <FiTrash2 /> Delete for me
                  </button>
                  <button onClick={() => {
                    if (window.confirm('Delete this message for everyone?')) {
                      deleteMessage(selectedMessage._id, true);
                    }
                  }}>
                    <FiTrash2 className="text-red-500" /> Delete for everyone
                  </button>
                </>
              )}
              <button onClick={() => {
                setShowReportModal(true);
                setShowOptions(false);
              }}>
                <FiFlag /> Report
              </button>
            </div>
            <button className="modal-close mt-4 w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowOptions(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showBlockConfirm && (
        <div className="modal-overlay" onClick={() => setShowBlockConfirm(false)}>
          <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {selectedConversation?.isBlocked ? 'Unblock User' : 'Block User'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedConversation?.isBlocked ? (
                `Are you sure you want to unblock ${selectedConversation?.otherParticipant?.name}?`
              ) : (
                `Are you sure you want to block ${selectedConversation?.otherParticipant?.name}? 
                You won't be able to send or receive messages from them.`
              )}
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowBlockConfirm(false)}>
                Cancel
              </button>
              <button className="danger-btn" onClick={selectedConversation?.isBlocked ? unblockUser : blockUser}>
                {selectedConversation?.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content animate-slideUp" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Message</h3>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a reason</option>
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="False Information">False Information</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional details..."
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowReportModal(false)}>
                Cancel
              </button>
              <button className="danger-btn" onClick={reportMessage}>
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMessage;