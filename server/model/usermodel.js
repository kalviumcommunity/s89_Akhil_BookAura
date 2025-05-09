const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define cart item schema (similar to CartModel but embedded in User)
const cartItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    coverimage: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

// Define purchased book schema
const purchasedBookSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    coverimage: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    paymentId: {
        type: String
    }
});

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
    // Add cart items directly to user model
    cartItems: [cartItemSchema],
    cartUpdatedAt: {
        type: Date,
        default: Date.now
    },
    // Add purchased books directly to user model
    purchasedBooks: [purchasedBookSchema],
    lastPurchaseDate: {
        type: Date
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