const express = require('express');
const router = express.Router();
const passport = require('passport'); // <-- Added import for passport
const User = require('../model/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookiePraser = require('cookie-parser');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

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

    // Set both cookie names for better compatibility
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Also set as 'token' for client-side checks
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Also set as 'token' for client-side checks
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Add a non-httpOnly cookie for client-side detection
    res.cookie('isLoggedIn', 'true', {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
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

router.get('/user', verifyToken, (req, res) => {
  res.status(200).send({ username: req.user.email });
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
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Also set as 'token' for client-side checks
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Add a non-httpOnly cookie for client-side detection
      res.cookie('isLoggedIn', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with success message and user data
      res.redirect(`http://localhost:5173/home?success=true&token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`http://localhost:5173/login?error=authentication_failed`);
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

module.exports = router;