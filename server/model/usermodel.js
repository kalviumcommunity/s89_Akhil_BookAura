const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password is required only if not using Google OAuth
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows null values for non-Google users
    },
    code: {
        type: String
    },
    codeExpires: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const User = mongoose.model('User', userSchema);

module.exports = User;