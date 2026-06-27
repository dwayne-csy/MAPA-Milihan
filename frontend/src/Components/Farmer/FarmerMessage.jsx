import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const FarmerMessage = () => {
  const navigate = useNavigate();
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.data);
      
      // Calculate unread counts
      const counts = {};
      response.data.data.forEach(conv => {
        counts[conv._id] = conv.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.data.messages || []);
      
      // Update unread count
      if (response.data.data.markedAsRead > 0) {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: 0
        }));
        // Also update in conversations list
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
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setTimeout(() => {
        // Reconnect after 3 seconds
        setWs(null);
      }, 3000);
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
        // New message received
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => [...prev, data.message]);
          // Mark as read
          markAsRead(data.conversationId);
        } else {
          // Update unread count
          setUnreadCounts(prev => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || 0) + 1
          }));
          // Refresh conversations
          fetchConversations();
        }
        break;

      case 'read_receipt':
        // Update message read status
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
          ));
        }
        break;

      case 'message_delivered':
        // Update message delivered status
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId ? { ...msg, delivered: true } : msg
          ));
        }
        break;

      case 'typing':
        // Update typing status
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setIsTyping(data.isTyping && data.userId !== currentUserId);
        }
        break;

      case 'user_online':
        // Update online status
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: data.isOnline
        }));
        break;

      case 'call_offer':
      case 'call_answer':
      case 'call_ice_candidate':
        // Handle WebRTC signaling
        handleCallSignaling(data);
        break;

      case 'call_end':
        // Handle call end
        handleCallEnd(data);
        break;

      default:
        console.log('Unknown WebSocket message:', data);
    }
  };

  // Mark messages as read
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
    if (!selectedConversation) return;

    setSending(true);
    
    const formData = new FormData();
    formData.append('receiverId', selectedConversation.otherParticipant.userId._id);
    formData.append('receiverType', selectedConversation.otherParticipant.userType);
    formData.append('receiverName', selectedConversation.otherParticipant.name);
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
      
      // Add message to list
      const sentMessage = response.data.data.messages[response.data.data.messages.length - 1];
      setMessages(prev => [...prev, sentMessage]);
      
      // Refresh conversations to update last message
      fetchConversations();

      // Clear typing status
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversationId: selectedConversation._id,
          isTyping: false
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 50MB.`);
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

  // Delete message
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
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Add reaction
  const addReaction = async (messageId, reaction) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/messages/conversations/${selectedConversation._id}/messages/${messageId}/reactions`,
        { reaction },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update message reactions
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const existingReaction = msg.reactions?.find(r => r.userId === currentUserId);
          if (existingReaction) {
            if (existingReaction.reaction === reaction) {
              // Remove reaction
              return {
                ...msg,
                reactions: msg.reactions.filter(r => r.userId !== currentUserId)
              };
            } else {
              // Update reaction
              return {
                ...msg,
                reactions: msg.reactions.map(r => 
                  r.userId === currentUserId ? { ...r, reaction } : r
                )
              };
            }
          } else {
            // Add reaction
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
    }
  };

  // Block user
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
      alert('User blocked successfully');
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  // Unblock user
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

      alert('User unblocked successfully');
      fetchConversations();
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  // Report message
  const reportMessage = async () => {
    if (!reportReason) {
      alert('Please select a reason');
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
      alert('Message reported successfully');
    } catch (error) {
      console.error('Error reporting message:', error);
      alert('Failed to report message');
    }
  };

  // Handle call signaling (WebRTC)
  const handleCallSignaling = (data) => {
    // This would be handled by WebRTC implementation
    console.log('Call signaling:', data);
  };

  const handleCallEnd = (data) => {
    console.log('Call ended:', data);
  };

  // Initiate call
  const initiateCall = (callType) => {
    if (!selectedConversation) return;

    const targetUser = selectedConversation.otherParticipant;
    
    // Send call offer via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'call_offer',
        conversationId: selectedConversation._id,
        targetUserId: targetUser.userId._id,
        callType: callType
      }));
    }

    // Navigate to call page
    navigate(`/farmer/call/${selectedConversation._id}`, {
      state: {
        callType,
        receiverId: targetUser.userId._id,
        receiverName: targetUser.name,
        receiverAvatar: targetUser.userId.avatar || null,
        isFarmer: true
      }
    });
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
    setReplyingTo(null);
    setMediaFiles([]);
    setNewMessage('');
    setShowMobileConversations(false);
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing status
    if (ws && ws.readyState === WebSocket.OPEN && selectedConversation) {
      ws.send(JSON.stringify({
        type: 'typing',
        conversationId: selectedConversation._id,
        isTyping: true
      }));
    }

    // Clear typing after 2 seconds of no input
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

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle back to conversations
  const handleBackToConversations = () => {
    setShowMobileConversations(true);
    setSelectedConversation(null);
    setMessages([]);
  };

  return (
    <div className="farmer-messages-container">
      <div className="messages-layout">
        {/* Conversations List */}
        <div className={`conversations-list ${showMobileConversations ? 'visible' : 'hidden'}`}>
          <div className="conversations-header">
            <h2>
              <FiMessageCircle />
              Messages
            </h2>
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-scroll">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="empty-state">
                <FiMessageCircle className="empty-icon" />
                <p>No conversations yet</p>
                <small>Start messaging by connecting with users</small>
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
                        <img src={other.userId.avatar} alt={other.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(other?.name)}
                        </div>
                      )}
                      <div className={`online-dot ${isOnline ? 'online' : 'offline'}`}></div>
                      {conv.isBlocked && (
                        <div className="blocked-badge">
                          <FiUserX />
                        </div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        <span>{other?.name || 'Unknown User'}</span>
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
          <div className="chat-area">
            {/* Chat Header */}
            <div className="chat-header">
              <button 
                className="back-btn"
                onClick={handleBackToConversations}
              >
                <FiArrowLeft />
              </button>
              <div className="chat-user-info">
                <div className="user-avatar">
                  {selectedConversation.otherParticipant?.userId?.avatar ? (
                    <img src={selectedConversation.otherParticipant.userId.avatar} alt="" />
                  ) : (
                    <div className="avatar-placeholder">
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
                      <span className="blocked-text">
                        <FiUserX /> Blocked
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
                {!selectedConversation.isBlocked && (
                  <>
                    <button 
                      className="action-btn"
                      onClick={() => initiateCall('audio')}
                      title="Voice Call"
                    >
                      <FiPhone />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => initiateCall('video')}
                      title="Video Call"
                    >
                      <FiVideoCall />
                    </button>
                  </>
                )}
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
            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <FiMessageCircle className="empty-icon" />
                  <p>No messages yet</p>
                  <small>Start a conversation with {selectedConversation.otherParticipant?.name}</small>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    if (msg.isDeleted && msg.deletedFor?.some(d => d.userId === currentUserId)) {
                      return null;
                    }

                    const isMyMessage = isSender(msg);
                    const userReaction = msg.reactions?.find(
                      r => r.userId === currentUserId
                    );
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
                              <img src={selectedConversation.otherParticipant.userId.avatar} alt="" />
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
                                      />
                                    )}
                                    {media.type === 'video' && (
                                      <video controls>
                                        <source src={media.url} type={media.mimetype} />
                                      </video>
                                    )}
                                    {media.type === 'audio' && (
                                      <audio controls>
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
              <div className="message-input-area">
                {replyingTo && (
                  <div className="reply-bar">
                    <div className="reply-info">
                      <span>Replying to {replyingTo.senderName}</span>
                      <span className="reply-content">{replyingTo.content}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)}>
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
                    {sending ? '...' : <FiSend />}
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
              <div className="blocked-message">
                <FiUserX />
                <p>You have blocked this user</p>
                <p className="blocked-subtext">You won't receive messages from them</p>
                <button onClick={unblockUser}>Unblock User</button>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-chat">
            <FiMessageCircle className="empty-icon" />
            <h3>Your Messages</h3>
            <p>Select a conversation to start messaging</p>
            <div className="empty-chat-tips">
              <small>💡 Connect with users to start chatting</small>
            </div>
          </div>
        )}
      </div>

      {/* Options Modal */}
      {showOptions && selectedMessage && (
        <div className="modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Message Options</h3>
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
                  <button onClick={() => {
                    deleteMessage(selectedMessage._id, false);
                  }}>
                    <FiTrash2 /> Delete for me
                  </button>
                  <button onClick={() => {
                    if (window.confirm('Delete this message for everyone?')) {
                      deleteMessage(selectedMessage._id, true);
                    }
                  }}>
                    <FiTrash2 /> Delete for everyone
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
            <button className="modal-close" onClick={() => setShowOptions(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="modal-overlay" onClick={() => setShowBlockConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedConversation?.isBlocked ? 'Unblock User' : 'Block User'}</h3>
            <p>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Report Message</h3>
            <div className="form-group">
              <label>Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
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
              <label>Description (Optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional details..."
                rows="4"
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

      {/* CSS Styles */}
      <style>{`
        .farmer-messages-container {
          height: 100vh;
          background: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .messages-layout {
          display: flex;
          height: calc(100vh - 64px);
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        /* Conversations List */
        .conversations-list {
          width: 380px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          background: #fafbfc;
        }

        .conversations-header {
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }

        .conversations-header h2 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .conversations-header h2 svg {
          color: #059669;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 8px 12px;
          gap: 8px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          background: #e5e7eb;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
        }

        .search-box svg {
          color: #9ca3af;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: #1f2937;
        }

        .search-box input::placeholder {
          color: #9ca3af;
        }

        .conversations-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .conversations-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .conversations-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .conversations-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          margin-bottom: 2px;
        }

        .conversation-item:hover {
          background: #f3f4f6;
        }

        .conversation-item.active {
          background: #e5f0ff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .conversation-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
        }

        .conversation-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .avatar-placeholder.small {
          width: 32px;
          height: 32px;
          font-size: 12px;
        }

        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          transition: all 0.3s;
        }

        .online-dot.online {
          background: #059669;
        }

        .online-dot.offline {
          background: #9ca3af;
        }

        .online-dot.small {
          width: 10px;
          height: 10px;
          bottom: 0;
          right: 0;
        }

        .blocked-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #ef4444;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          border: 2px solid white;
        }

        .conversation-info {
          flex: 1;
          min-width: 0;
        }

        .conversation-name {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
          color: #1f2937;
        }

        .unread-badge {
          background: #059669;
          color: white;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .conversation-last-message {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-indicator {
          margin-left: 4px;
        }

        .conversation-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2px;
        }

        .conversation-time {
          font-size: 11px;
          color: #9ca3af;
        }

        .role-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 500;
        }

        .role-badge.farmer {
          background: #d1fae5;
          color: #065f46;
        }

        .role-badge.admin {
          background: #dbeafe;
          color: #1e40af;
        }

        .role-badge.user {
          background: #f3f4f6;
          color: #4b5563;
        }

        /* Chat Area */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
        }

        .back-btn {
          display: none;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #374151;
          padding: 4px;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: #059669;
        }

        .chat-user-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .user-status {
          font-size: 12px;
          color: #6b7280;
        }

        .blocked-text {
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .online-text {
          color: #059669;
        }

        .offline-text {
          color: #9ca3af;
        }

        .typing-text {
          color: #059669;
          animation: typingDots 1.5s infinite;
        }

        @keyframes typingDots {
          0%, 20% { content: '.'; }
          40%, 60% { content: '..'; }
          80%, 100% { content: '...'; }
        }

        .chat-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }

        .action-btn.danger:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        /* Messages Area */
        .messages-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #f9fafb;
        }

        .messages-area::-webkit-scrollbar {
          width: 4px;
        }

        .messages-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-area::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .empty-messages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
        }

        .empty-messages .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
          color: #d1d5db;
        }

        .message-wrapper {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .message-wrapper.own {
          flex-direction: row-reverse;
        }

        .message-avatar {
          flex-shrink: 0;
          width: 32px;
        }

        .message-avatar-spacer {
          width: 32px;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 70%;
        }

        .reply-preview {
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 2px;
          font-size: 13px;
          border-left: 3px solid #059669;
        }

        .reply-sender {
          font-weight: 500;
          color: #059669;
        }

        .reply-text {
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .message-bubble {
          background: white;
          padding: 10px 14px;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          word-wrap: break-word;
        }

        .message-wrapper.own .message-bubble {
          background: #059669;
          color: white;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.5;
        }

        .message-media {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .media-item {
          max-width: 250px;
        }

        .media-item img {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .media-item img:hover {
          transform: scale(1.02);
        }

        .media-item video {
          width: 100%;
          max-height: 300px;
          border-radius: 8px;
        }

        .media-item audio {
          width: 200px;
        }

        .document-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 8px;
          color: #1f2937;
          text-decoration: none;
          font-size: 13px;
          transition: background 0.2s;
        }

        .document-link:hover {
          background: #e5e7eb;
        }

        .message-wrapper.own .document-link {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .message-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
          color: #9ca3af;
        }

        .message-wrapper.own .message-footer {
          justify-content: flex-end;
        }

        .message-status {
          display: flex;
          align-items: center;
        }

        .message-status .read {
          color: #3b82f6;
        }

        .message-status .delivered {
          color: #9ca3af;
        }

        .message-reactions {
          display: flex;
          gap: 2px;
        }

        .reaction {
          font-size: 16px;
          cursor: default;
        }

        .message-actions-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .message-actions-btn:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        /* Message Input */
        .message-input-area {
          padding: 16px 20px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .reply-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .reply-info {
          flex: 1;
        }

        .reply-info span {
          font-size: 13px;
          color: #6b7280;
        }

        .reply-content {
          font-weight: 500;
          color: #1f2937;
        }

        .reply-bar button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          transition: color 0.2s;
        }

        .reply-bar button:hover {
          color: #ef4444;
        }

        .media-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .media-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .media-preview-item img,
        .media-preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-preview-item .file-name {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-preview-item button {
          position: absolute;
          top: 2px;
          right: 2px;
          background: rgba(0,0,0,0.7);
          border: none;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .media-preview-item button:hover {
          background: #ef4444;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f3f4f6;
          border-radius: 24px;
          padding: 4px 12px;
          transition: all 0.2s;
        }

        .input-wrapper:focus-within {
          background: #e5e7eb;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
        }

        .input-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 6px;
          font-size: 18px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .input-btn:hover {
          color: #1f2937;
        }

        .message-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 10px 0;
          outline: none;
          font-size: 14px;
          color: #1f2937;
          resize: none;
        }

        .message-input::placeholder {
          color: #9ca3af;
        }

        .send-btn {
          background: #059669;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: #047857;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .emoji-picker-wrapper {
          position: absolute;
          bottom: 80px;
          right: 20px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 12px;
          overflow: hidden;
        }

        /* Blocked Message */
        .blocked-message {
          padding: 20px;
          text-align: center;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .blocked-message svg {
          font-size: 48px;
          color: #ef4444;
          margin-bottom: 8px;
        }

        .blocked-subtext {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .blocked-message button {
          margin-top: 12px;
          padding: 8px 20px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .blocked-message button:hover {
          background: #047857;
        }

        /* Empty Chat */
        .empty-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          background: #f9fafb;
        }

        .empty-chat .empty-icon {
          font-size: 64px;
          color: #d1d5db;
          margin-bottom: 16px;
        }

        .empty-chat h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .empty-chat-tips {
          margin-top: 16px;
          background: #f3f4f6;
          padding: 8px 16px;
          border-radius: 8px;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-content h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .modal-content p {
          color: #6b7280;
          margin-bottom: 16px;
        }

        .modal-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .modal-options button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: none;
          background: #f9fafb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #1f2937;
        }

        .modal-options button:hover {
          background: #f3f4f6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .modal-actions button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .danger-btn {
          background: #ef4444;
          color: white;
        }

        .danger-btn:hover {
          background: #dc2626;
        }

        .modal-close {
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          border: none;
          background: #f3f4f6;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: #e5e7eb;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #1f2937;
        }

        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #059669;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-state .empty-icon {
          font-size: 48px;
          color: #d1d5db;
          margin-bottom: 12px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .messages-layout {
            height: calc(100vh - 56px);
            border-radius: 0;
            flex-direction: column;
          }

          .conversations-list {
            width: 100%;
            border-right: none;
            height: 100%;
            display: flex;
          }

          .conversations-list.hidden {
            display: none;
          }

          .conversations-list.visible {
            display: flex;
          }

          .chat-area {
            width: 100%;
            height: 100%;
          }

          .back-btn {
            display: block;
          }

          .message-content {
            max-width: 85%;
          }

          .emoji-picker-wrapper {
            right: 10px;
            bottom: 90px;
          }

          .media-item {
            max-width: 200px;
          }

          .chat-header {
            padding: 12px 16px;
          }

          .messages-area {
            padding: 12px 16px;
          }

          .message-input-area {
            padding: 12px 16px;
          }

          .user-name {
            font-size: 14px;
          }

          .role-badge {
            font-size: 9px;
            padding: 1px 4px;
          }
        }

        @media (max-width: 480px) {
          .conversations-header h2 {
            font-size: 18px;
          }

          .conversation-item {
            padding: 10px;
          }

          .conversation-avatar {
            width: 40px;
            height: 40px;
          }

          .message-bubble {
            padding: 8px 12px;
          }

          .message-text {
            font-size: 13px;
          }

          .media-item {
            max-width: 150px;
          }

          .input-wrapper {
            padding: 2px 8px;
          }

          .message-input {
            font-size: 13px;
            padding: 8px 0;
          }

          .send-btn {
            width: 32px;
            height: 32px;
          }

          .modal-content {
            padding: 16px;
            margin: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FarmerMessage;