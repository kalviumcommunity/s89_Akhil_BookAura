import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  // Edit profile states
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
    // Redirect if not logged in
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/router/profile', {
          withCredentials: true
        });

        if (response.data.success) {
          setUserData(response.data.user);
          // Initialize edit data with current user data
          setEditData({
            username: response.data.user.username,
            email: response.data.user.email,
            profileImage: response.data.user.profileImage
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoggedIn, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/home');
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

      const response = await axios.put('http://localhost:5000/router/update-profile', editData, {
        withCredentials: true
      });

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

      const response = await axios.put('http://localhost:5000/router/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        withCredentials: true
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

      const response = await axios.delete('http://localhost:5000/router/delete-account', {
        data: { password: deletePassword },
        withCredentials: true
      });

      if (response.data.success) {
        await logout();
        navigate('/home');
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
          <div className="loading">Loading...</div>
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
