const express = require('express');
const router = express.Router();
const User = require('../model/userModel');
const Book = require('../model/BookModel');
const auth = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching cart for user:', userId);

        // Find the user and get their cart items
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return cart items from user document
        console.log('Cart found with items:', user.cartItems ? user.cartItems.length : 0);

        res.status(200).json({
            success: true,
            message: 'Cart fetched successfully',
            data: user.cartItems || []
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.body;

        console.log('Adding book to cart for user:', userId, 'Book ID:', bookId);

        if (!bookId) {
            console.log('Book ID is missing in request');
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
            });
        }

        // Find the book
        const book = await Book.findById(bookId);
        if (!book) {
            console.log('Book not found with ID:', bookId);
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        console.log('Book found:', book.title);

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Initialize cartItems array if it doesn't exist
        if (!user.cartItems) {
            user.cartItems = [];
        }

        // Check if the book is already in the cart
        const existingItemIndex = user.cartItems.findIndex(
            item => item.bookId.toString() === bookId
        );

        if (existingItemIndex > -1) {
            console.log('Book already in cart');
            // Book already in cart, just return success
            return res.status(200).json({
                success: true,
                message: 'Book already in cart',
                data: user.cartItems
            });
        }

        // Add the book to the user's cart
        console.log('Adding new book to cart');
        user.cartItems.push({
            bookId: book._id,
            title: book.title,
            author: book.author,
            price: book.price,
            coverimage: book.coverimage,
            quantity: 1,
            addedAt: new Date()
        });

        // Update cart timestamp
        user.cartUpdatedAt = new Date();

        await user.save();
        console.log('User cart updated successfully, now contains items:', user.cartItems.length);

        res.status(200).json({
            success: true,
            message: 'Book added to cart successfully',
            data: user.cartItems
        });
    } catch (error) {
        console.error('Error adding to cart:', error);

        // Check for specific error types
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID format',
                error: error.message
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error adding to cart',
            error: error.message
        });
    }
});

// Remove item from cart (DELETE method)
router.delete('/remove/:bookId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.params;

        console.log('Removing book from cart for user:', userId, 'Book ID:', bookId);

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if the user has a cart
        if (!user.cartItems || user.cartItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Check if the book is in the cart - handle both string and ObjectId comparisons
        const existingItemIndex = user.cartItems.findIndex(
            item => item.bookId.toString() === bookId.toString()
        );

        if (existingItemIndex === -1) {
            console.log('Book not found in cart');
            return res.status(404).json({
                success: false,
                message: 'Book not found in cart'
            });
        }

        // Remove the book from the cart
        console.log('Removing book from cart at index:', existingItemIndex);
        user.cartItems.splice(existingItemIndex, 1);

        // Update cart timestamp
        user.cartUpdatedAt = new Date();

        await user.save();
        console.log('User cart updated successfully, now contains items:', user.cartItems.length);

        res.status(200).json({
            success: true,
            message: 'Book removed from cart successfully',
            data: user.cartItems
        });
    } catch (error) {
        console.error('Error removing from cart:', error);

        // Check for specific error types
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID format',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error removing from cart',
            error: error.message
        });
    }
});

// Alternative endpoint for removing items (POST method)
router.post('/remove', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
            });
        }

        console.log('Alternative remove endpoint - Removing book from cart for user:', userId, 'Book ID:', bookId);

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if the user has a cart
        if (!user.cartItems || user.cartItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Check if the book is in the cart - handle both string and ObjectId comparisons
        const existingItemIndex = user.cartItems.findIndex(
            item => item.bookId.toString() === bookId.toString()
        );

        if (existingItemIndex === -1) {
            console.log('Book not found in cart');
            return res.status(404).json({
                success: false,
                message: 'Book not found in cart'
            });
        }

        // Remove the book from the cart
        console.log('Removing book from cart at index:', existingItemIndex);
        user.cartItems.splice(existingItemIndex, 1);

        // Update cart timestamp
        user.cartUpdatedAt = new Date();

        await user.save();
        console.log('User cart updated successfully, now contains items:', user.cartItems.length);

        res.status(200).json({
            success: true,
            message: 'Book removed from cart successfully',
            data: user.cartItems
        });
    } catch (error) {
        console.error('Error removing from cart:', error);

        // Check for specific error types
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID format',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error removing from cart',
            error: error.message
        });
    }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Clearing cart for user:', userId);

        // Find the user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Clear the cart
        user.cartItems = [];

        // Update cart timestamp
        user.cartUpdatedAt = new Date();

        await user.save();
        console.log('User cart cleared successfully');

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: user.cartItems
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

module.exports = router;
