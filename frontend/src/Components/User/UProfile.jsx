// Mapa-Milihan/frontend/src/Components/User/UProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaUser, 
  FaEdit, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaUserPlus,
  FaUserMinus,
  FaCalendarAlt,
  FaSpinner,
  FaCheckCircle,
  FaPaperPlane,
  FaArrowLeft,
  FaImage,
  FaPlayCircle,
  FaTimes,
  FaStore
} from 'react-icons/fa';
import UserHeader from '../layouts/Header';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

// Helper function to check if URL is video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mpeg', '.ogg', '.3gpp', '.flv', '.wmv'];
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) return true;
  if (videoMimeTypes.some(mime => url.toLowerCase().includes(mime))) return true;
  if (url.includes('/video/upload/')) return true;
  
  return false;
};

const UProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'followers' or 'following'
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = typeof userData === 'string' ? JSON.parse(userData) : userData;
        setCurrentUser(parsed);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
          
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setIsFollowing(profileData.isFollowing || false);
        setFollowersCount(profileData.stats.followersCount);
        setFollowingCount(profileData.stats.followingCount);
        setPosts(profileData.posts || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const response = await axios({
        method: isFollowing ? 'delete' : 'post',
        url: `${API_BASE_URL}/api/profile/${userId}/${endpoint}`,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
        toast.success(isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    }
  };

  // Handle message button click - navigate to user messages with userId
  const handleMessage = async () => {
    // Check if trying to message yourself
    if (currentUser && (userId === currentUser._id || userId === currentUser.id)) {
      toast.warning("You cannot send messages to yourself");
      return;
    }
    
    // Check if the profile user exists
    if (!profile || !profile.user) {
      toast.error("User not found");
      return;
    }
    
    const profileUserId = profile.user.id || profile.user._id;

    // Check if trying to message yourself using profile data
    if (currentUser && profileUserId && 
        (profileUserId === currentUser._id || profileUserId === currentUser.id)) {
      toast.warning("You cannot send messages to yourself");
      return;
    }
    
    // Navigate to user messages with the userId as a parameter
    // Message.jsx will handle creating the conversation if it doesn't exist
    navigate(`/messages/${userId}`);
  };

  // Handle edit profile navigation
  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle opening modal for followers/following
  const handleStatClick = async (type) => {
    if (type === 'posts') {
      const postsSection = document.getElementById('posts-section');
      if (postsSection) {
        postsSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Open modal for followers or following
    setShowModal(true);
    setModalType(type);
    setModalLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'followers' ? 'followers' : 'following';
      const response = await axios.get(
        `${API_BASE_URL}/api/profile/${userId}/${endpoint}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setModalUsers(response.data.data[type] || []);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`Failed to load ${type}`);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalUsers([]);
    setModalType('');
  };

  // Helper function to get author name from post
  const getAuthorName = (post) => {
    if (post.authorName) return post.authorName;
    if (post.author?.name) return post.author.name;
    if (post.author?.userId?.name) return post.author.userId.name;
    if (post.userId?.name) return post.userId.name;
    return 'Unknown User';
  };

  // Helper function to get author avatar from post
  const getAuthorAvatar = (post) => {
    if (post.authorAvatar) return post.authorAvatar;
    if (post.author?.avatar) return post.author.avatar;
    if (post.author?.userId?.avatar) return post.author.userId.avatar;
    if (post.userId?.avatar) return post.userId.avatar;
    return '/default-avatar.png';
  };

  // Render post media (image or video)
  const renderPostMedia = (mediaItems) => {
    if (!mediaItems || mediaItems.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {mediaItems.map((media, index) => {
          const mediaUrl = media.url;
          const isVideo = isVideoUrl(mediaUrl);
          
          return (
            <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
              {isVideo ? (
                <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden">
                  <video 
                    src={mediaUrl} 
                    className="w-full h-full object-cover"
                    controls
                    muted
                    playsInline
                  />
                  <FaPlayCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl text-white/80 pointer-events-none" />
                </div>
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={`Post media ${index + 1}`} 
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="flex flex-col items-center justify-center h-48 bg-gray-100 text-gray-400 rounded-lg">
                        <FaImage class="text-4xl mb-2" />
                        <span>Image not available</span>
                      </div>
                    `;
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="text-4xl text-green-500 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center p-10 bg-white rounded-lg shadow-md max-w-md w-full">
            <p className="text-gray-700">{error || 'Profile not found'}</p>
            <button 
              className="mt-5 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              onClick={() => navigate('/')}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, isOwnProfile } = profile;

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Back Button */}
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-transparent border-none cursor-pointer text-green-500 text-base font-medium mb-5 hover:text-green-600 transition-colors"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <img 
                src={user.avatar?.url || user.avatar || '/default-avatar.png'} 
                alt={user.name}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-green-500"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 w-full">
              {/* Name Section */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2">
                  {user.name}
                  {user.isVerified && (
                    <FaCheckCircle className="text-green-500 text-xl sm:text-2xl" />
                  )}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.userType === 'Farmer' 
                      ? 'bg-orange-500 text-white flex items-center gap-1' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {user.userType === 'Farmer' && <FaStore className="text-xs" />}
                    {user.userType}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-5">
                <div 
                  className="flex flex-col items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all hover:scale-105"
                  onClick={() => handleStatClick('posts')}
                >
                  <span className="text-xl font-semibold text-gray-800">{posts.length}</span>
                  <span className="text-sm text-gray-600">Posts</span>
                </div>
                <div 
                  className="flex flex-col items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all hover:scale-105"
                  onClick={() => handleStatClick('followers')}
                >
                  <span className="text-xl font-semibold text-gray-800">{followersCount}</span>
                  <span className="text-sm text-gray-600">Followers</span>
                </div>
                <div 
                  className="flex flex-col items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all hover:scale-105"
                  onClick={() => handleStatClick('following')}
                >
                  <span className="text-xl font-semibold text-gray-800">{followingCount}</span>
                  <span className="text-sm text-gray-600">Following</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mb-4 space-y-2">
                <p className="flex items-center gap-3 text-gray-600">
                  <FaEnvelope className="text-gray-400" /> {user.email}
                </p>
                {user.contact && (
                  <p className="flex items-center gap-3 text-gray-600">
                    <FaPhone className="text-gray-400" /> {user.contact}
                  </p>
                )}
                {user.address && (user.address.city || user.address.barangay) && (
                  <p className="flex items-center gap-3 text-gray-600">
                    <FaMapMarkerAlt className="text-gray-400" /> 
                    {[
                      user.address.street,
                      user.address.barangay,
                      user.address.city,
                      user.address.zipcode
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <FaCalendarAlt /> Joined {formatDate(user.createdAt)}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <button 
                    className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    onClick={handleEditProfile}
                  >
                    <FaEdit /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
                        isFollowing 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? <FaUserMinus /> : <FaUserPlus />}
                      {isFollowing ? ' Following' : ' Follow'}
                    </button>
                    <button 
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                      onClick={handleMessage}
                    >
                      <FaPaperPlane /> Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div id="posts-section" className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-5">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <p>No posts yet</p>
              {isOwnProfile && (
                <button 
                  className="mt-4 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  onClick={() => navigate('/forum/create')}
                >
                  Create Your First Post
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const authorName = getAuthorName(post);
                const authorAvatar = getAuthorAvatar(post);
                
                return (
                  <div key={post._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={authorAvatar} 
                        alt={authorName}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{authorName}</h4>
                        <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700 leading-relaxed mb-3">{post.content}</p>
                      {renderPostMedia(post.media)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl w-[90%] max-w-md max-h-[80vh] shadow-2xl overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button 
                className="bg-transparent border-none text-2xl cursor-pointer text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={closeModal}
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                  <FaSpinner className="text-4xl text-green-500 animate-spin" />
                  <p className="mt-3">Loading...</p>
                </div>
              ) : modalUsers.length === 0 ? (
                <p className="text-center py-10 text-gray-400">
                  No {modalType === 'followers' ? 'followers' : 'following'} yet
                </p>
              ) : (
                <div className="space-y-3">
                  {modalUsers.map((user) => (
                    <div 
                      key={user._id} 
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        closeModal();
                        navigate(`/profile/${user._id}`);
                      }}
                    >
                      <img 
                        src={user.avatar?.url || user.avatar || '/default-avatar.png'} 
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.userType || 'User'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UProfile;