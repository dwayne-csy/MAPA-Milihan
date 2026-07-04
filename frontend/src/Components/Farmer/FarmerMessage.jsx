// Mapa-Milihan/frontend/src/Components/Farmer/FarmerMessage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import FarmerHeader from '../layouts/FarmerHeader';
import { 
  FiSend, 
  FiPaperclip, 
  FiMoreVertical,
  FiTrash2,
  FiFlag,
  FiSmile,
  FiX,
  FiCheck,
  FiCheckCircle,
  FiArrowLeft,
  FiSearch,
  FiUserX,
  FiUserCheck,
  FiMessageCircle,
  FiFile
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow, format } from 'date-fns';

const FarmerMessage = () => {
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
  const [initializing, setInitializing] = useState(false);
  const isCreatingConversationRef = useRef(false);
  const initializedRef = useRef(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.id) return decoded.id;
        if (decoded.userId) return decoded.userId;
        if (decoded._id) return decoded._id;
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed._id) return parsed._id;
        if (parsed.id) return parsed.id;
        if (parsed.userId) return parsed.userId;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check self-messaging
  useEffect(() => {
    if (userId && currentUserId && userId === currentUserId) {
      toast.warning("You cannot send messages to yourself");
      navigate('/farmer/messages');
    }
  }, [userId, currentUserId, navigate]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.user) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        try {
          const altResponse = await axios.get(`${API_BASE_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (altResponse.data.data?.user) {
            setCurrentUser(altResponse.data.data.user);
          }
        } catch (altError) {
          console.error('Alternative user fetch failed:', altError);
        }
      }
    };
    fetchCurrentUser();
  }, [API_BASE_URL, token]);

  // Select conversation
  const selectConversation = useCallback((conversation) => {
    if (!conversation) return;
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    setReplyingTo(null);
    setMediaFiles([]);
    setNewMessage('');
    setShowMobileConversations(false);
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let messagesData = response.data.data.messages || [];
      
      // 🔥 FILTER OUT HIDDEN MESSAGES
      messagesData = messagesData.filter(msg => !msg.isHidden);
      
      setMessages(messagesData);
      
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const convData = response.data.data || [];
      setConversations(convData);
      
      const counts = {};
      convData.forEach(conv => {
        counts[conv._id] = conv.unreadCount || 0;
      });
      setUnreadCounts(counts);

      return convData;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token]);

  // Create conversation
  const createConversationWithUser = useCallback(async (targetUserId) => {
    if (isCreatingConversation) return;
    if (currentUserId && targetUserId === currentUserId) {
      toast.warning("You cannot send messages to yourself");
      return;
    }
    
    setIsCreatingConversation(true);
    
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/api/profile/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let userData = null;
      if (userResponse.data.success && userResponse.data.data) {
        userData = userResponse.data.data.user || userResponse.data.data;
      } else if (userResponse.data.user) {
        userData = userResponse.data.user;
      } else {
        userData = userResponse.data;
      }
      
      if (!userData || !userData._id) {
        toast.error('Could not find user data');
        setIsCreatingConversation(false);
        return;
      }
      
      let userType = userData.userType || userData.role || 'User';
      const validTypes = ['User', 'Farmer', 'Admin'];
      if (!validTypes.includes(userType)) {
        const normalized = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
        userType = validTypes.includes(normalized) ? normalized : 'User';
      }
      
      const userName = userData.name || userData.username || 'User';
      
      const response = await axios.post(
        `${API_BASE_URL}/api/messages/conversations/get-or-create`,
        { targetUserId, targetUserType: userType, targetUserName: userName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const conversation = response.data.data;
        setConversations(prev => {
          const exists = prev.find(c => c._id === conversation._id);
          if (exists) return prev.map(c => c._id === conversation._id ? conversation : c);
          return [conversation, ...prev];
        });
        setUnreadCounts(prev => ({ ...prev, [conversation._id]: conversation.unreadCount || 0 }));
        selectConversation(conversation);
        toast.success('Conversation started!');
        return conversation;
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Could not start conversation');
      return null;
    } finally {
      setIsCreatingConversation(false);
    }
  }, [API_BASE_URL, token, selectConversation, isCreatingConversation, currentUserId]);

  // Initialize WebSocket
  useEffect(() => {
    if (!token) return;
    
    const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/messages?token=${token}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data.type);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
      setTimeout(() => setWs(null), 3000);
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
        // 🔥 Only add message if it's not hidden
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          if (!data.message.isHidden) {
            setMessages(prev => [...prev, data.message]);
          }
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
        setOnlineUsers(prev => ({ ...prev, [data.userId]: data.isOnline }));
        break;
      case 'online_users':
        if (data.users) {
          const onlineMap = {};
          data.users.forEach(id => { onlineMap[id] = true; });
          setOnlineUsers(onlineMap);
        }
        break;
      default: break;
    }
  };

  // Mark as read
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

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && mediaFiles.length === 0) return;
    
    if (!selectedConversation) {
      if (userId) {
        if (currentUserId && userId === currentUserId) {
          toast.warning("You cannot send messages to yourself");
          return;
        }
        toast.info('Creating conversation...');
        await createConversationWithUser(userId);
        setTimeout(() => {
          if (selectedConversation) sendMessage();
          else toast.error('Could not create conversation');
        }, 1500);
      } else {
        toast.error('No conversation selected');
      }
      return;
    }

    setSending(true);
    const formData = new FormData();
    const otherParticipant = selectedConversation.otherParticipant;
    
    if (!otherParticipant) {
      toast.error('Recipient not found');
      setSending(false);
      return;
    }
    
    let receiverId = otherParticipant.userId?._id || otherParticipant.userId || otherParticipant._id;
    if (!receiverId) {
      toast.error('Recipient ID not found');
      setSending(false);
      return;
    }
    
    let receiverType = otherParticipant.userType || 'User';
    const validTypes = ['User', 'Farmer', 'Admin'];
    if (!validTypes.includes(receiverType)) receiverType = 'User';
    const receiverName = otherParticipant.name || otherParticipant.userId?.name || 'User';
    
    formData.append('receiverId', receiverId);
    formData.append('receiverType', receiverType);
    formData.append('receiverName', receiverName);
    formData.append('content', newMessage);
    if (replyingTo) formData.append('replyToMessageId', replyingTo._id);
    mediaFiles.forEach(file => formData.append('media', file));

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
      // 🔥 Only add if not hidden
      if (!sentMessage.isHidden) {
        setMessages(prev => [...prev, sentMessage]);
      }
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
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 50MB.`);
        return false;
      }
      return true;
    });
    setMediaFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${messageId}`,
        { data: { deleteForEveryone }, headers: { Authorization: `Bearer ${token}` } }
      );
      if (deleteForEveryone) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isDeleted: true } : msg
        ));
      }
      setShowOptions(false);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const addReaction = async (messageId, reaction) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${messageId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const existing = msg.reactions?.find(r => r.userId === currentUserId);
          if (existing) {
            if (existing.reaction === reaction) {
              return { ...msg, reactions: msg.reactions.filter(r => r.userId !== currentUserId) };
            } else {
              return { ...msg, reactions: msg.reactions.map(r => 
                r.userId === currentUserId ? { ...r, reaction } : r
              )};
            }
          } else {
            return { ...msg, reactions: [...(msg.reactions || []), { userId: currentUserId, reaction }] };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

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
      toast.success('User blocked');
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

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
      toast.success('User unblocked');
      fetchConversations();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  // ===== REPORT MESSAGE FUNCTION =====
  const reportMessage = async () => {
    console.log('📝 reportMessage called');
    console.log('reportReason:', reportReason);
    console.log('selectedMessage:', selectedMessage);
    console.log('selectedConversation:', selectedConversation);

    // Validate reason is selected
    if (!reportReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    // Validate we have a selected message
    if (!selectedMessage || !selectedMessage._id) {
      toast.error('No message selected to report');
      return;
    }

    // Validate we have a selected conversation
    if (!selectedConversation || !selectedConversation._id) {
      toast.error('No conversation selected');
      return;
    }

    try {
      console.log('📤 Sending report request to:', `${API_BASE_URL}/api/admin/messages/${selectedMessage._id}/report`);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/messages/${selectedMessage._id}/report`,
        { 
          conversationId: selectedConversation._id,
          reason: reportReason, 
          description: reportDescription || '' 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('✅ Report response:', response.data);

      if (response.data.success) {
        toast.success('Message reported successfully');
        // Close modal and reset state
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        setSelectedMessage(null);
        setShowOptions(false);
      } else {
        toast.error(response.data.message || 'Failed to report message');
      }
    } catch (error) {
      console.error('❌ Error reporting message:', error);
      console.error('Error response:', error.response);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 400 && error.response?.data?.message === 'You have already reported this content') {
        toast.error('You have already reported this message');
      } else {
        toast.error('Failed to report message. Please try again.');
      }
    }
  };

  // ===== HANDLE KEY PRESS =====
  const handleKeyPress = (e) => {
    // If report modal is open, don't send message on Enter
    if (showReportModal) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        reportMessage();
      }
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (typingTimeout) clearTimeout(typingTimeout);
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

  // ========== DERIVED VALUES ==========
  const filteredConversations = conversations.filter(conv => {
    const name = conv.otherParticipant?.name?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase());
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const isSender = (message) => message.senderId === currentUserId;

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (typeof avatar === 'string') return avatar;
    if (typeof avatar === 'object' && avatar.url) return avatar.url;
    return null;
  };

  const isUserOnline = (userId) => onlineUsers[userId] || false;

  const handleBackToConversations = () => {
    setShowMobileConversations(true);
    setSelectedConversation(null);
    setMessages([]);
  };

  // ========== MAIN INITIALIZATION ==========
  useEffect(() => {
    if (!token || initializedRef.current) return;

    const initializeMessages = async () => {
      setInitializing(true);
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const convData = response.data.data || [];
        setConversations(convData);
        const counts = {};
        convData.forEach(conv => { counts[conv._id] = conv.unreadCount || 0; });
        setUnreadCounts(counts);
        setLoading(false);

        if (userId) {
          const currentId = getCurrentUserId();
          if (currentId && userId === currentId) {
            toast.warning("You cannot message yourself");
            navigate('/farmer/messages');
            setInitializing(false);
            return;
          }

          const existingConv = convData.find(conv => {
            const other = conv.otherParticipant;
            if (!other) return false;
            const otherId = other.userId?._id || other.userId || other._id;
            return otherId && otherId.toString() === userId.toString();
          });

          if (existingConv) {
            setSelectedConversation(existingConv);
            await fetchMessages(existingConv._id);
            setShowMobileConversations(false);
            initializedRef.current = true;
            setInitializing(false);
            return;
          }

          let targetUserName = 'User';
          let targetUserType = 'User';
          
          try {
            const userResponse = await axios.get(`${API_BASE_URL}/api/profile/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userResponse.data.success && userResponse.data.data) {
              const userData = userResponse.data.data.user || userResponse.data.data;
              if (userData) {
                targetUserName = userData.name || 'User';
                targetUserType = userData.userType || userData.role || 'User';
                const validTypes = ['User', 'Farmer', 'Admin'];
                if (!validTypes.includes(targetUserType)) {
                  const normalized = targetUserType.charAt(0).toUpperCase() + targetUserType.slice(1).toLowerCase();
                  targetUserType = validTypes.includes(normalized) ? normalized : 'User';
                }
              }
            }
          } catch (e) {
            console.log('Could not fetch user profile:', e.message);
          }

          try {
            const createResponse = await axios.post(
              `${API_BASE_URL}/api/messages/conversations/get-or-create`,
              { targetUserId: userId, targetUserType, targetUserName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (createResponse.data.success) {
              const newConv = createResponse.data.data;
              setConversations(prev => {
                const exists = prev.find(c => c._id === newConv._id);
                if (exists) return prev.map(c => c._id === newConv._id ? newConv : c);
                return [newConv, ...prev];
              });
              setSelectedConversation(newConv);
              setMessages([]);
              setShowMobileConversations(false);
              setUnreadCounts(prev => ({ ...prev, [newConv._id]: 0 }));
              toast.success('Conversation started!');
            } else {
              toast.error('Could not start conversation');
            }
          } catch (error) {
            console.error('Error creating conversation:', error);
            toast.error('Could not start conversation');
          }
        } else {
          setShowMobileConversations(true);
        }
      } catch (error) {
        console.error('Error initializing messages:', error);
        toast.error('Failed to load messages');
        setLoading(false);
        setShowMobileConversations(true);
      } finally {
        setInitializing(false);
        initializedRef.current = true;
      }
    };

    initializeMessages();
  }, [API_BASE_URL, token, userId]);

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <FarmerHeader />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-140px)] flex">
          {/* Sidebar - Conversations List */}
          <div className={`w-80 border-r border-gray-200 flex flex-col ${showMobileConversations ? 'flex' : 'hidden'} sm:flex`}>
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FiMessageCircle className="text-green-500 text-lg" />
                Messages
              </h2>
              <div className="mt-2 flex items-center bg-gray-100 rounded-lg px-3 py-1.5">
                <FiSearch className="text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-700 ml-2"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              {loading || initializing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FiMessageCircle className="text-3xl text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start messaging by connecting with users</p>
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
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?._id === conv._id ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectConversation(conv)}
                    >
                      <div className="relative flex-shrink-0">
                        {getAvatarUrl(other?.userId?.avatar) || getAvatarUrl(other?.avatar) ? (
                          <img src={getAvatarUrl(other?.userId?.avatar) || getAvatarUrl(other?.avatar)} alt={other?.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-medium">
                            {getInitials(other?.name)}
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 truncate">{other?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                            {lastMsg?.createdAt && formatTimestamp(lastMsg.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate">
                            {lastMsg?.content || 'No messages yet'}
                            {lastMsg?.mediaType && (
                              <span className="ml-1">
                                {lastMsg.mediaType === 'image' && '📷'}
                                {lastMsg.mediaType === 'video' && '🎥'}
                              </span>
                            )}
                          </span>
                          {unread > 0 && (
                            <span className="bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1">
                              {unread}
                            </span>
                          )}
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
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200 flex-shrink-0 bg-white">
                <button className="sm:hidden text-gray-600" onClick={handleBackToConversations}>
                  <FiArrowLeft />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getAvatarUrl(selectedConversation.otherParticipant?.userId?.avatar) || getAvatarUrl(selectedConversation.otherParticipant?.avatar) ? (
                    <img src={getAvatarUrl(selectedConversation.otherParticipant?.userId?.avatar) || getAvatarUrl(selectedConversation.otherParticipant?.avatar)} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-medium">
                      {getInitials(selectedConversation.otherParticipant?.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {selectedConversation.otherParticipant?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedConversation.isBlocked ? (
                        'Blocked'
                      ) : isTyping ? (
                        <span className="text-green-500">Typing...</span>
                      ) : isUserOnline(selectedConversation.otherParticipant?.userId?._id) ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        'Offline'
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button 
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm"
                    onClick={() => setShowBlockConfirm(true)}
                  >
                    {selectedConversation.isBlocked ? <FiUserCheck size={16} /> : <FiUserX size={16} />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FiMessageCircle className="text-3xl text-gray-300 mb-2" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Say hello to {selectedConversation.otherParticipant?.name}</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    if (msg.isDeleted && msg.deletedFor?.some(d => d.userId === currentUserId)) return null;
                    const isMyMessage = isSender(msg);
                    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);

                    return (
                      <div key={msg._id} className={`flex items-end gap-1.5 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                        {!isMyMessage && showAvatar && (
                          <div className="flex-shrink-0">
                            {getAvatarUrl(selectedConversation.otherParticipant?.userId?.avatar) || getAvatarUrl(selectedConversation.otherParticipant?.avatar) ? (
                              <img src={getAvatarUrl(selectedConversation.otherParticipant?.userId?.avatar) || getAvatarUrl(selectedConversation.otherParticipant?.avatar)} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium">
                                {getInitials(selectedConversation.otherParticipant?.name)}
                              </div>
                            )}
                          </div>
                        )}
                        {!isMyMessage && !showAvatar && <div className="w-6 flex-shrink-0"></div>}
                        <div className={`max-w-[70%] ${isMyMessage ? 'items-end' : ''}`}>
                          {msg.replyTo && (
                            <div className="text-xs bg-gray-100 rounded px-2 py-1 mb-0.5 border-l-2 border-green-500">
                              <span className="font-medium text-gray-700">{msg.replyTo.senderName}</span>
                              <span className="text-gray-500 ml-1">{msg.replyTo.content}</span>
                            </div>
                          )}
                          <div className={`rounded-lg px-3 py-1.5 text-sm ${isMyMessage ? 'bg-green-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                            {msg.content}
                            {msg.media && msg.media.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {msg.media.map((media, idx) => (
                                  <div key={idx}>
                                    {media.type === 'image' && (
                                      <img src={media.url} alt="Media" className="max-w-[200px] max-h-32 rounded cursor-pointer" onClick={() => window.open(media.url, '_blank')} />
                                    )}
                                    {media.type === 'video' && (
                                      <video controls className="max-w-[200px] max-h-32 rounded">
                                        <source src={media.url} type={media.mimetype} />
                                      </video>
                                    )}
                                    {media.type === 'document' && (
                                      <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs flex items-center gap-1">
                                        <FiFile size={12} /> {media.fileName || 'Document'}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 ${isMyMessage ? 'justify-end' : ''}`}>
                            <span>{formatTimestamp(msg.createdAt)}</span>
                            {isMyMessage && (
                              <span>{msg.isRead ? <FiCheckCircle className="text-green-500" size={12} /> : <FiCheck size={12} />}</span>
                            )}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <span className="flex gap-0.5">
                                {msg.reactions.map((r, idx) => (
                                  <span key={idx} className="text-xs">{r.reaction}</span>
                                ))}
                              </span>
                            )}
                            <button
                              className="text-gray-400 hover:text-gray-600"
                              onClick={() => { setSelectedMessage(msg); setShowOptions(true); }}
                            >
                              <FiMoreVertical size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {!selectedConversation.isBlocked ? (
                <div className="p-2 border-t border-gray-200 bg-white flex-shrink-0">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 mb-1 text-xs">
                      <span>Replying to <span className="font-medium">{replyingTo.senderName}</span>: {replyingTo.content}</span>
                      <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500"><FiX size={14} /></button>
                    </div>
                  )}
                  {mediaFiles.length > 0 && (
                    <div className="flex gap-1 mb-1 flex-wrap">
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden">
                          {file.type.startsWith('image/') && <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />}
                          {file.type.startsWith('video/') && <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />}
                          <button onClick={() => removeMediaFile(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                    <button className="p-1 text-gray-500 hover:text-gray-700 rounded" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      <FiSmile size={18} />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-gray-700 rounded" onClick={() => fileInputRef.current?.click()}>
                      <FiPaperclip size={18} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" style={{ display: 'none' }} />
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none outline-none text-sm py-1"
                      ref={messageInputRef}
                    />
                    <button
                      className={`p-1 rounded-full text-white ${(!newMessage.trim() && mediaFiles.length === 0) || sending ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'}`}
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && mediaFiles.length === 0) || sending}
                    >
                      {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiSend size={18} />}
                    </button>
                  </div>
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 right-4 z-10">
                      <EmojiPicker onEmojiClick={(emoji) => { setNewMessage(prev => prev + emoji.emoji); setShowEmojiPicker(false); }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 bg-gray-50 border-t border-gray-200">
                  <FiUserX className="text-2xl text-red-400 mx-auto mb-1" />
                  <p className="text-sm font-medium">You have blocked this user</p>
                  <button onClick={unblockUser} className="mt-2 px-4 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">Unblock</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <FiMessageCircle className="text-4xl text-gray-300 mb-3" />
              <h3 className="text-base font-medium text-gray-600">Your Messages</h3>
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showOptions && selectedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowOptions(false)}>
          <div className="bg-white rounded-lg p-4 w-72 max-w-[90%]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Message Options</h3>
            <div className="space-y-1">
              <button onClick={() => { setReplyingTo(selectedMessage); setShowOptions(false); messageInputRef.current?.focus(); }} className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-50 rounded">
                <FiMessageCircle size={16} /> Reply
              </button>
              {isSender(selectedMessage) && (
                <>
                  <button onClick={() => deleteMessage(selectedMessage._id, false)} className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-50 rounded">
                    <FiTrash2 size={16} /> Delete for me
                  </button>
                  <button onClick={() => { if (window.confirm('Delete for everyone?')) deleteMessage(selectedMessage._id, true); }} className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-50 rounded text-red-500">
                    <FiTrash2 size={16} /> Delete for everyone
                  </button>
                </>
              )}
              <button 
                onClick={() => { 
                  console.log('📤 Opening report modal for message:', selectedMessage);
                  setShowReportModal(true); 
                  setShowOptions(false);
                }} 
                className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-50 rounded"
              >
                <FiFlag size={16} /> Report
              </button>
            </div>
            <button className="w-full mt-3 p-2 text-sm text-gray-500 hover:bg-gray-50 rounded" onClick={() => setShowOptions(false)}>Close</button>
          </div>
        </div>
      )}

      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBlockConfirm(false)}>
          <div className="bg-white rounded-lg p-5 w-80 max-w-[90%]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{selectedConversation?.isBlocked ? 'Unblock' : 'Block'} User</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedConversation?.isBlocked ? `Unblock ${selectedConversation?.otherParticipant?.name}?` : `Block ${selectedConversation?.otherParticipant?.name}? You won't be able to message them.`}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded" onClick={() => setShowBlockConfirm(false)}>Cancel</button>
              <button className="flex-1 p-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded" onClick={selectedConversation?.isBlocked ? unblockUser : blockUser}>
                {selectedConversation?.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => {
          console.log('❌ Closing report modal (clicked outside)');
          setShowReportModal(false);
          setReportReason('');
          setReportDescription('');
          setSelectedMessage(null);
        }}>
          <div className="bg-white rounded-lg p-5 w-80 max-w-[90%]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Report Message</h3>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-700 block mb-1">Reason *</label>
              <select 
                value={reportReason} 
                onChange={(e) => setReportReason(e.target.value)} 
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none"
              >
                <option value="">Select a reason</option>
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="False Information">False Information</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700 block mb-1">Description (Optional)</label>
              <textarea 
                value={reportDescription} 
                onChange={(e) => setReportDescription(e.target.value)} 
                rows="3" 
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none resize-none" 
                placeholder="Add details..." 
              />
            </div>
            <div className="flex gap-2">
              <button 
                className="flex-1 p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded" 
                onClick={() => {
                  console.log('❌ Cancelling report');
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  setSelectedMessage(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="flex-1 p-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={reportMessage}
                disabled={!reportReason}
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerMessage;