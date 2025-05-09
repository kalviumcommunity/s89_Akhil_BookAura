const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");
const Purchase = require("../model/PurchaseModel");
const mongoose = require("mongoose");

// routes/payment.js
router.post("/create-checkout-session", auth, async (req, res) => {
    try {
      const { book, books } = req.body;

      // Handle both single book and multiple books
      let lineItems = [];

      if (books && Array.isArray(books) && books.length > 0) {
        // Handle multiple books
        lineItems = books.map(book => ({
          price_data: {
            currency: "inr",
            product_data: {
              name: book.title,
              description: `By ${book.author}`,
              images: [book.coverimage],
            },
            unit_amount: book.price * 100, // price in cents
          },
          quantity: 1,
        }));
      } else if (book) {
        // Handle single book
        lineItems = [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: book.title,
                description: `By ${book.author}`,
                images: [book.coverimage],
              },
              unit_amount: book.price * 100, // price in cents
            },
            quantity: 1,
          },
        ];
      } else {
        return res.status(400).json({ error: "No books provided" });
      }

      // Calculate total amount
      let totalAmount = 0;
      if (books && Array.isArray(books)) {
        totalAmount = books.reduce((sum, book) => sum + book.price, 0);
      } else if (book) {
        totalAmount = book.price;
      }

      // Create a unique ID for this purchase to track it
      const purchaseId = new mongoose.Types.ObjectId();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchaseId}`,
        cancel_url: "http://localhost:5173/cart",
        metadata: {
          purchaseId: purchaseId.toString(),
          userId: req.user.id
        }
      });

      // Store purchase information temporarily
      const purchaseData = {
        _id: purchaseId,
        userId: req.user.id,
        books: books || [book],
        totalAmount: totalAmount,
        paymentStatus: 'pending'
      };

      // Store in session for later retrieval
      req.session.pendingPurchase = purchaseData;

      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Route to handle successful payments and save purchases
  router.post("/save-purchase", auth, async (req, res) => {
    try {
      const { sessionId, purchaseId, books } = req.body;
      const userId = req.user.id;

      if (!sessionId || !purchaseId) {
        return res.status(400).json({ error: "Missing session ID or purchase ID" });
      }

      // Verify the payment with Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Get the books from the request
      const purchaseBooks = books;
      
      // Calculate total amount
      const totalAmount = purchaseBooks.reduce((sum, book) => sum + book.price, 0);

      // Find the user to update their purchased books
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add books to user's purchased books
      const purchasedBooksToAdd = purchaseBooks.map(book => ({
        bookId: book._id,
        title: book.title,
        author: book.author,
        coverimage: book.coverimage,
        price: book.price,
        url: book.url,
        purchaseDate: new Date()
      }));

      // Initialize purchasedBooks array if it doesn't exist
      if (!user.purchasedBooks) {
        user.purchasedBooks = [];
      }

      user.purchasedBooks.push(...purchasedBooksToAdd);
      
      // Save the updated user
      await user.save();

      // Create a new purchase record
      const purchase = new Purchase({
        _id: purchaseId,
        userId: userId,
        books: purchaseBooks.map(book => ({
          bookId: book._id,
          title: book.title,
          author: book.author,
          coverimage: book.coverimage,
          price: book.price,
          url: book.url
        })),
        totalAmount: totalAmount,
        paymentId: sessionId,
        purchaseDate: new Date()
      });

      // Save the purchase to the database
      await purchase.save();

      res.status(201).json({
        success: true,
        message: "Purchase saved successfully",
        purchaseId: purchase._id
      });
    } catch (error) {
      console.error("Error saving purchase:", error);
      res.status(500).json({ error: "Failed to save purchase" });
    }
  });

  // Route to get user's purchased books
  router.get("/my-purchases", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('Fetching purchased books for user:', userId);

      // Find the user to get their purchased books
      const User = require('../model/userModel');
      const user = await User.findById(userId);

      if (!user) {
        console.log('User not found:', userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has purchased books
      if (!user.purchasedBooks || user.purchasedBooks.length === 0) {
        console.log('User has no purchased books, checking Purchase collection for backward compatibility');

        // For backward compatibility, check the Purchase collection
        const purchases = await Purchase.find({ userId: userId })
          .sort({ purchaseDate: -1 });

        if (purchases.length > 0) {
          console.log('Found', purchases.length, 'purchases in Purchase collection');

          // Migrate purchases to user model
          const purchasedBooks = [];

          for (const purchase of purchases) {
            for (const book of purchase.books) {
              purchasedBooks.push({
                bookId: book.bookId,
                title: book.title,
                author: book.author,
                coverimage: book.coverimage,
                price: book.price,
                url: book.url,
                purchaseDate: book.purchaseDate || purchase.purchaseDate,
                paymentId: purchase.paymentId
              });
            }
          }

          // Update user's purchased books
          user.purchasedBooks = purchasedBooks;
          user.lastPurchaseDate = purchases[0].purchaseDate;
          await user.save();

          console.log('Migrated', purchasedBooks.length, 'books to user model');

          return res.status(200).json({
            success: true,
            purchasedBooks: user.purchasedBooks
          });
        }

        // No purchases found in either place
        return res.status(200).json({
          success: true,
          purchasedBooks: []
        });
      }

      console.log('Found', user.purchasedBooks.length, 'purchased books in user model');

      // Return the purchased books from user model
      res.status(200).json({
        success: true,
        purchasedBooks: user.purchasedBooks
      });
    } catch (error) {
      console.error("Error fetching purchased books:", error);
      res.status(500).json({ error: "Failed to fetch purchased books" });
    }
  });

  // Remove the webhook route and handleSuccessfulPayment function

  module.exports = router;
