const express = require('express');
const router = express.Router();
const User = require('../model/usermodel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

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

        res.status(200).json({ message: 'Login successful', user });
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
            service: "Gmail",
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

        return res.status(200).send({ msg: "Verification code sent successfully" });
    } catch (error) {
        res.status(500).send({ msg: "Something went wrong", error });
    }
});

// Reset Password Route
router.put('/resetpassword', async (req, res) => {
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

module.exports = router;