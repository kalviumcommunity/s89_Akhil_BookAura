const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
// Cookie-parser is already used at the app level
const { verifyToken } = require('../middleware/auth');
const { loadModel } = require('../utils/modelLoader');

// Load environment variables using our centralized utility
require('../utils/envConfig');

// Load User model using our utility
const User = loadModel('userModel');

const JWT_SECRET = process.env.JWT_SECRET; // Ensure JWT_SECRET is defined

// Register Route
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

    // Set secure cookie settings based on environment - same as login route
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSettings = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: isProduction ? '.onrender.com' : undefined // Match domain in production
    };

    // Set both cookie names for better compatibility
    res.cookie('authToken', token, cookieSettings);

    // Also set as 'token' for client-side checks
    res.cookie('token', token, cookieSettings);

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      ...cookieSettings,
      httpOnly: false // This one needs to be accessible from JS
    });

    // Return token in response for client-side storage
    res.status(201).json({ message: 'User registered successfully', user: savedUser, token });
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

    // Set secure cookie settings based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSettings = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: isProduction ? '.onrender.com' : undefined // Match domain in production
    };

    // Set both cookie names for better compatibility
    res.cookie('authToken', token, cookieSettings);

    // Also set as 'token' for client-side checks
    res.cookie('token', token, cookieSettings);

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      ...cookieSettings,
      httpOnly: false // This one needs to be accessible from JS
    });
    res.status(200).json({ message: 'Login successful', token });
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
      from: '"BookAura Support" <bookaura.ba@gmail.com>',
      to: user.email,
      subject: "Password Reset Code",
      text: `Hello ${user.name || ""},
      We received a request to reset your password. Please use the following code to proceed:
      🔒 Reset Code: ${code}
      If you did not request a password reset, please ignore this email.
      Best regards,
      BookAura Team`,
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

router.get('/user', verifyToken, (req, res) => {
  res.status(200).send({ username: req.user.email });
});

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
router.get('/auth/google', (req, res, next) => {
  console.log('Google OAuth login route accessed');
  console.log('- Request headers:', req.headers);
  console.log('- Request URL:', req.originalUrl);

  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth not configured - redirecting to error page');
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('Environment variables available:', Object.keys(process.env).filter(key =>
      key.includes('GOOGLE') || key.includes('CLIENT')
    ));

    // Get frontend URL from environment variable or use default
    const frontendUrl = process.env.FRONTEND_URL || 'https://bookauraba.netlify.app';

    // Redirect to login page with error message
    return res.redirect(`${frontendUrl}/login?error=google_auth_not_configured`);
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' // Force account selection
  })(req, res, next);
});

// Google OAuth Callback Route
router.get('/auth/google/callback', (req, res, next) => {
  console.log('Google OAuth callback route accessed');
  console.log('- Request headers:', req.headers);
  console.log('- Request URL:', req.originalUrl);
  console.log('- Query parameters:', req.query);

  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth not configured - redirecting to error page');
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('Environment variables available:', Object.keys(process.env).filter(key =>
      key.includes('GOOGLE') || key.includes('CLIENT')
    ));

    // Get frontend URL from environment variable or use default
    const frontendUrl = process.env.FRONTEND_URL || 'https://bookauraba.netlify.app';

    // Redirect to login page with error message
    return res.redirect(`${frontendUrl}/login?error=google_auth_not_configured`);
  }

  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true
  })(req, res, next);
}, (req, res) => {
    try {
      console.log('Google OAuth authentication successful');
      console.log('- User:', req.user ? req.user._id : 'No user');
      // Generate JWT Token for Google OAuth
      const token = jwt.sign({
        id: req.user._id,
        email: req.user.email,
        username: req.user.username
      }, JWT_SECRET, { expiresIn: '7d' });

      // Set secure cookie settings based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieSettings = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: isProduction ? '.onrender.com' : undefined // Match domain in production
      };

      // Set both cookie names for better compatibility
      res.cookie('authToken', token, cookieSettings);

      // Also set as 'token' for client-side checks
      res.cookie('token', token, cookieSettings);

      // Add a non-httpOnly cookie for client-side detection
      res.cookie('isLoggedIn', 'true', {
        ...cookieSettings,
        httpOnly: false // This one needs to be accessible from JS
      });

      // Determine the frontend URL based on the request origin
      let frontendUrl = process.env.FRONTEND_URL || 'https://bookauraba.netlify.app/';

      // Try to get the origin from the request headers
      const origin = req.get('origin') || req.headers.referer;

      if (origin) {
        // Extract the origin from the referer if available
        try {
          const url = new URL(origin);
          frontendUrl = `${url.protocol}//${url.host}`;
          console.log('Using origin from request:', frontendUrl);
        } catch (err) {
          console.log('Error parsing origin:', err.message);
        }
      } else if (req.headers.host) {
        // If no origin/referer, try to determine from host
        const host = req.headers.host;

        // For localhost development
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          frontendUrl = `http://${host.includes(':') ? host : host + ':5173'}`;
          console.log('Using localhost frontend URL:', frontendUrl);
        }
      }

      // Include user ID in the URL for client-side processing
      const userId = req.user._id;

      console.log('Redirecting to frontend URL:', frontendUrl);

      // Redirect to frontend with success message, token, and user ID
      res.redirect(`${frontendUrl}/?success=true&token=${token}&user_id=${userId}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      // Get frontend URL from environment variable or use default
      const frontendUrl = process.env.FRONTEND_URL || 'https://bookauraba.netlify.app/';
      res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }
  }
);

// Logout Route - Only clears authentication cookies and session
// Does NOT delete any user data from the database
router.get('/logout', (req, res) => {
  try {
    // Set secure cookie settings based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSettings = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.onrender.com' : undefined
    };

    // Clear all auth cookies with proper settings
    res.clearCookie('authToken', cookieSettings);
    res.clearCookie('token', cookieSettings);
    res.clearCookie('isLoggedIn', {
      ...cookieSettings,
      httpOnly: false
    });

    // If using passport session
    if (req.logout) {
      // Handle different passport versions
      if (req.logout.length) {
        // Passport > 0.6.0
        req.logout(function(err) {
          if (err) {
            console.error('Error during passport logout:', err);
          }
        });
      } else {
        // Passport <= 0.5.0
        req.logout();
      }
    }

    // Clear session
    req.session.destroy();

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

      // Set secure cookie settings based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieSettings = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: isProduction ? '.onrender.com' : undefined // Match domain in production
      };

      // Update cookies
      res.cookie('authToken', newToken, cookieSettings);
      res.cookie('token', newToken, cookieSettings);
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

    // Set secure cookie settings based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieSettings = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? '.onrender.com' : undefined
    };

    // Clear all auth cookies with proper settings
    res.clearCookie('authToken', cookieSettings);
    res.clearCookie('token', cookieSettings);
    res.clearCookie('isLoggedIn', {
      ...cookieSettings,
      httpOnly: false
    });

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