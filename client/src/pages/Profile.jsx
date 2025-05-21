import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../pagescss/Profile.css';
import { User, Lock, Edit2, Trash2, X, Check, Upload, Camera } from 'lucide-react';

const Profile = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    profileImage: ''
  });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    console.log('Profile component mounted, auth status:', isLoggedIn ? 'Logged in' : 'Not logged in');

    // Check authentication status
    if (!isLoggedIn && !loading) {
      console.log('User not logged in, redirecting to login page');
      navigate('/login');
      return;
    }

    // Don't fetch if we're still loading auth state or not logged in
    if (loading || !isLoggedIn) {
      console.log('Waiting for auth state to resolve...');
      return;
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, showing default data');
        setLoading(false);

        // Try to get cached user data from localStorage
        const cachedUserData = localStorage.getItem('userData');
        if (cachedUserData) {
          try {
            const parsedData = JSON.parse(cachedUserData);
            setUserData(parsedData);
            setEditData({
              username: parsedData.username,
              email: parsedData.email,
              profileImage: parsedData.profileImage
            });
          } catch (e) {
            console.error('Error parsing cached user data:', e);
          }
        }
      }
    }, 5000); // 5 second timeout

    // Fetch user data
    const fetchUserData = async () => {
      try {
        console.log('Fetching user profile data...');

        // Get token from localStorage
        const token = localStorage.getItem('authToken');

        // Set up headers with token if available
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Add a timestamp parameter to prevent caching
        const timestamp = new Date().getTime();

        // Set a timeout for the API request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await api.get(`/router/profile?_t=${timestamp}`, {
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId); // Clear the timeout if request completes

        if (response.data.success) {
          console.log('User profile data retrieved successfully');
          const userData = response.data.user;

          // Cache the user data in localStorage
          localStorage.setItem('userData', JSON.stringify(userData));

          setUserData(userData);
          // Initialize edit data with current user data
          setEditData({
            username: userData.username,
            email: userData.email,
            profileImage: userData.profileImage
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);

        // If we get a 401 error, the token might be invalid or expired
        if (error.response && error.response.status === 401) {
          console.log('Authentication failed, redirecting to login');

          // Clear any stored auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');

          // Clear cookies
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          navigate('/login');
        } else {
          // For other errors, try to use cached data
          const cachedUserData = localStorage.getItem('userData');
          if (cachedUserData) {
            try {
              const parsedData = JSON.parse(cachedUserData);
              setUserData(parsedData);
              setEditData({
                username: parsedData.username,
                email: parsedData.email,
                profileImage: parsedData.profileImage
              });
            } catch (e) {
              console.error('Error parsing cached user data:', e);
            }
          }
        }

        setLoading(false);
      }
    };

    fetchUserData();

    // Clean up the timeout when the component unmounts
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [isLoggedIn, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Handle edit profile form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({
          ...editData,
          profileImage: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    try {
      setEditError('');
      setEditSuccess('');

      // Validate inputs
      if (!editData.username.trim()) {
        setEditError('Username cannot be empty');
        return;
      }

      if (!editData.email.trim()) {
        setEditError('Email cannot be empty');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        setEditError('Please enter a valid email address');
        return;
      }

      const response = await api.put('/router/update-profile', editData);

      if (response.data.success) {
        setUserData(response.data.user);
        setEditSuccess('Profile updated successfully');
        setEditMode(false);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setEditSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(error.response?.data?.message || 'Error updating profile');
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Handle update password
  const handleUpdatePassword = async () => {
    try {
      setPasswordError('');
      setPasswordSuccess('');

      // Validate inputs
      if (!passwordData.currentPassword) {
        setPasswordError('Current password is required');
        return;
      }

      if (!passwordData.newPassword) {
        setPasswordError('New password is required');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      // Password strength validation
      if (passwordData.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        return;
      }

      const response = await api.put('/router/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordSuccess('Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setPasswordSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error.response?.data?.message || 'Error updating password');
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      setDeleteError('');

      const response = await api.delete('/router/delete-account', {
        data: { password: deletePassword }
      });

      if (response.data.success) {
        await logout();
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error.response?.data?.message || 'Error deleting account');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card loading-card">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <h2>Loading Profile Data...</h2>
              <p>Please wait while we fetch your information.</p>
              <p>If this takes too long, the page will automatically load with cached data.</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        <div className="profile-card">
          {/* Profile Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              Profile
            </button>
            <button
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={16} />
              Security
            </button>
          </div>

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              {!editMode ? (
                // View Mode
                <>
                  <div className="profile-header">
                    <div className="profile-image-container">
                      <img
                        src={userData.profileImage}
                        alt="Profile"
                        className="profile-image"
                      />
                      <button
                        className="edit-profile-button"
                        onClick={() => setEditMode(true)}
                        title="Edit Profile"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <h1>{userData.username}</h1>
                    <p>{userData.email}</p>
                  </div>

                  <div className="profile-actions">
                    <button
                      className="logout-button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                // Edit Mode
                <div className="edit-profile-form">
                  <h2>Edit Profile</h2>

                  {editError && <div className="error-message">{editError}</div>}
                  {editSuccess && <div className="success-message">{editSuccess}</div>}

                  <div className="profile-image-edit">
                    <img
                      src={editData.profileImage}
                      alt="Profile"
                      className="profile-image"
                    />
                    <label className="image-upload-label">
                      <Camera size={16} />
                      <span>Change Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={editData.username}
                      onChange={handleEditChange}
                      placeholder="Username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleEditChange}
                      placeholder="Email"
                    />
                  </div>

                  <div className="edit-actions">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setEditMode(false);
                        setEditError('');
                        setEditSuccess('');
                        // Reset edit data to current user data
                        setEditData({
                          username: userData.username,
                          email: userData.email,
                          profileImage: userData.profileImage
                        });
                      }}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      className="save-button"
                      onClick={handleSaveProfile}
                    >
                      <Check size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Tab Content */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <div className="security-section">
                <h2>Change Password</h2>

                {passwordError && <div className="error-message">{passwordError}</div>}
                {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}

                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Current Password"
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm New Password"
                  />
                </div>

                <button
                  className="update-password-button"
                  onClick={handleUpdatePassword}
                >
                  Update Password
                </button>
              </div>

              <div className="security-section danger-zone">
                <h2>Delete Account</h2>
                <p>This action cannot be undone. All your data will be permanently deleted.</p>

                {!showDeleteConfirm ? (
                  <button
                    className="delete-account-button"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    {deleteError && <div className="error-message">{deleteError}</div>}

                    <div className="form-group">
                      <label>Enter your password to confirm</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Password"
                      />
                    </div>

                    <div className="delete-actions">
                      <button
                        className="cancel-button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setDeleteError('');
                        }}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        className="confirm-delete-button"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 size={16} />
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
