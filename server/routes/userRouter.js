const express = require('express');
const router = express.Router();
const passport = require('passport'); // <-- Added import for passport
const User = require('../model/usermodel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookiePraser = require('cookie-parser');
const {verifyToken} = require('../middleware/auth');
require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET; // Ensure JWT_SECRET is defined


router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existsEmail = await User.findOne({ email });
    if (existsEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 13);
    const user = new User({ username, email, password: hashedPassword });
    const savedUser = await user.save();
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set both cookie names for better compatibility
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Also set as 'token' for client-side checks
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.status(201).json({ message: 'User registered successfully', user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set both cookie names for better compatibility
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Also set as 'token' for client-side checks
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
    // Include user data in the response for immediate use
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot Password Route
router.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ msg: "User not found, try another email" });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const hashedCode = await bcrypt.hash(code.toString(), 10);

    user.code = hashedCode;
    user.codeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port:587,
      auth: {
        user: process.env.email_nodemailer,
        pass: process.env.password_nodemailer
      }
    });

    await transporter.sendMail({
      from: "bookaura.ba@gmail.com",
      to: user.email,
      subject: "Your Password Reset Code",
      text: `Your code is: ${code}`
    });

    return res.status(200).send({ msg: "Verification code sent successfully, check spam mails" });
  } catch (error) {
    res.status(500).send({ msg: "Something went wrong", error });
  }
});

// Reset Password Route
router.post('/resetpassword', async (req, res) => {
  try {
    const { email, code, newpassword } = req.body;
    if (!email || !code || !newpassword) {
      return res.status(400).send({ msg: "Enter all fields" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.codeExpires || Date.now() > user.codeExpires) {
      return res.status(400).send({ msg: "Code expired or user does not exist" });
    }

    const isCodeValid = await bcrypt.compare(code, user.code);
    if (!isCodeValid) {
      return res.status(400).send({ msg: "Invalid verification code" });
    }

    const newHashedPassword = await bcrypt.hash(newpassword, 13);
    user.password = newHashedPassword;
    await user.save();

    return res.status(200).send({ msg: "Password changed successfully" });
  } catch (error) {
    res.status(500).send({ msg: "Something went wrong", error });
  }
});

// This route was duplicated - removed in favor of the more complete implementation below

// Get user profile data
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // The ID is stored in the JWT token
    const userId = req.user.id;
    console.log('User ID from token:', userId);
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Get user profile image
router.get('/profile-image', verifyToken, async (req, res) => {
  try {
    // The ID is stored in the JWT token
    const userId = req.user.id;
    console.log('User ID from token (profile-image):', userId);
    const user = await User.findById(userId).select('profileImage username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      profileImage: user.profileImage,
      username: user.username
    });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile image',
      error: error.message
    });
  }
});

// Google OAuth Login Route
router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force account selection
  })
);

// Google OAuth Callback Route
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    try {
      // Generate JWT Token for Google OAuth
      const token = jwt.sign({
        id: req.user._id,
        email: req.user.email,
        username: req.user.username
      }, JWT_SECRET, { expiresIn: '7d' });

      // Set both cookie names for better compatibility
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Also set as 'token' for client-side checks
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Add a non-httpOnly cookie for client-side detection
      res.cookie('isLoggedIn', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // Redirect to frontend with success message and user data
      res.redirect(`https://bookauraba.netlify.app/?success=true&token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`https://bookauraba.netlify.app/login?error=authentication_failed`);
    }
  }
);

// Logout Route
router.get('/logout', (req, res) => {
  try {
    // Clear all auth cookies
    res.clearCookie('authToken');
    res.clearCookie('token');
    res.clearCookie('isLoggedIn');

    // If using passport session
    if (req.logout) {
      req.logout();
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

// Update user profile
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, profileImage } = req.body;

    // Validate input
    if (!username && !email && !profileImage) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Check if username is already taken (if changing username)
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check if email is already taken (if changing email)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (profileImage) updateData.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token with updated info if email or username changed
    if (username || email) {
      const newToken = jwt.sign({
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username
      }, JWT_SECRET, { expiresIn: '7d' });

      // Update cookies
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Update password
router.put('/update-password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a password (Google users might not)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update password for accounts without a password (e.g., Google accounts)'
      });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 13);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

// Delete account
router.delete('/delete-account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user has a password (not Google account), verify it
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    // Clear cookies
    res.clearCookie('authToken');
    res.clearCookie('token');
    res.clearCookie('isLoggedIn');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
});

module.exports = router;