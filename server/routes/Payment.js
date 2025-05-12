const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");
const Purchase = require("../model/PurchaseModel");
const User = require("../model/userModel");
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
        cancel_url: "http://localhost:5173/cancel",
        metadata: {
          purchaseId: purchaseId.toString(),
          userId: req.user.id,
          totalAmount: totalAmount.toString()
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
      console.log("==== SAVE PURCHASE REQUEST STARTED ====");
      const { sessionId, purchaseId, books } = req.body;

      // Validate user ID from auth middleware
      if (!req.user || !req.user.id) {
        console.error("User ID missing from auth middleware");
        return res.status(401).json({ error: "Authentication failed. Please log in again." });
      }

      const userId = req.user.id;

      console.log("Save purchase request received:");
      console.log("- User ID:", userId);
      console.log("- Session ID:", sessionId);
      console.log("- Purchase ID:", purchaseId);
      console.log("- Books count:", books ? books.length : 0);

      if (!purchaseId) {
        return res.status(400).json({ error: "Missing purchase ID" });
      }

      // Skip Stripe verification for development purposes
      console.log("WARNING: Skipping Stripe verification for development purposes");

      // Get the books from the request
      const purchaseBooks = books;

      console.log("Books received:", JSON.stringify(purchaseBooks));

      if (!purchaseBooks || !Array.isArray(purchaseBooks) || purchaseBooks.length === 0) {
        console.error("No books provided or invalid books data");
        return res.status(400).json({ error: "No valid books data provided" });
      }

      // Check if books have all required fields
      const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];
      let missingFields = false;

      // Process books to ensure all required fields are present
      const processedBooks = purchaseBooks.map(book => {
        const missing = requiredFields.filter(field => !book[field]);
        if (missing.length > 0) {
          console.error(`Book ${book.title || 'unknown'} is missing fields:`, missing);
          missingFields = true;
          return book;
        }

        // If url is missing, add a valid default PDF URL
        if (!book.url) {
          console.warn(`Book ${book.title} is missing url field, adding default PDF`);
          return { ...book, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' };
        }

        // Ensure PDF URLs have the correct format
        if (book.url && book.url.includes('cloudinary') && book.url.includes('raw') && !book.url.toLowerCase().endsWith('.pdf')) {
          console.log(`Adding .pdf extension to Cloudinary URL for book "${book.title}"`);
          return { ...book, url: `${book.url}.pdf` };
        }

        return book;
      });

      if (missingFields) {
        return res.status(400).json({ error: "Some books are missing required fields" });
      }

      // Calculate total amount
      const totalAmount = processedBooks.reduce((sum, book) => sum + book.price, 0);
      console.log("Total amount calculated:", totalAmount);

      // Find the user to update their purchased books
      console.log("Looking for user with ID:", userId);
      const user = await User.findById(userId);

      if (!user) {
        console.error("User not found with ID:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      console.log("User found:", user.username);

      // Add books to user's purchased books, avoiding duplicates
      const purchasedBooksToAdd = [];

      // Initialize purchasedBooks array if it doesn't exist
      if (!user.purchasedBooks) {
        user.purchasedBooks = [];
      }

      // Create a set of existing book IDs for quick lookup
      const existingBookIds = new Set(user.purchasedBooks.map(book => book.bookId.toString()));

      // Remove excess code and ensure efficient handling of duplicate books
      for (const book of processedBooks) {
          const bookId = book._id.toString();
      
          // Skip if user already owns this book
          if (existingBookIds.has(bookId)) {
              console.log(`User ${user.username} already owns book "${book.title}" (${bookId}), skipping`);
              continue;
          }
      
          // Get the direct Cloudinary URL without any transformations
          let directUrl = book.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      
          // If it's a Cloudinary URL and ends with .pdf, remove the .pdf extension
          if (directUrl.includes('cloudinary.com') &&
              directUrl.includes('raw') &&
              directUrl.toLowerCase().endsWith('.pdf')) {
              console.log(`Removing .pdf extension from Cloudinary URL for book "${book.title}"`);
              directUrl = directUrl.substring(0, directUrl.length - 4);
          }
      
          // Add to the list of books to add
          purchasedBooksToAdd.push({
              bookId: book._id,
              title: book.title,
              author: book.author,
              coverimage: book.coverimage,
              price: book.price,
              url: directUrl,
              purchaseDate: new Date(),
              paymentId: sessionId || 'dev-session'
          });
      
          // Add to the set to prevent duplicates within the same purchase
          existingBookIds.add(bookId);
      }

      console.log(`Adding ${purchasedBooksToAdd.length} new books to user ${user.username}'s library`);
      user.purchasedBooks.push(...purchasedBooksToAdd);

      // Save the updated user
      await user.save();

      // Create a new purchase record
      const purchase = new Purchase({
        _id: purchaseId,
        userId: userId,
        books: processedBooks.map(book => {
          // Get the direct Cloudinary URL without any transformations
          let directUrl = book.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

          // If it's a Cloudinary URL and ends with .pdf, remove the .pdf extension
          if (directUrl.includes('cloudinary.com') &&
              directUrl.includes('raw') &&
              directUrl.toLowerCase().endsWith('.pdf')) {
            directUrl = directUrl.substring(0, directUrl.length - 4);
          }

          return {
            bookId: book._id,
            title: book.title,
            author: book.author,
            coverimage: book.coverimage,
            price: book.price,
            url: directUrl
          };
        }),
        totalAmount: totalAmount,
        paymentId: sessionId || 'dev-session',
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
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to save purchase", message: error.message });
    }
  });

  // Route to get user's purchased books
  router.get("/my-purchases", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('Fetching purchased books for user:', userId);

      // Find the user to get their purchased books
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
              // Get the direct Cloudinary URL without any transformations
              let bookUrl = book.url;
              if (bookUrl && bookUrl.includes('cloudinary') && bookUrl.includes('raw')) {
                // If it ends with .pdf, remove it to store the direct URL
                if (bookUrl.toLowerCase().endsWith('.pdf')) {
                  console.log(`Removing .pdf extension from Cloudinary URL for book "${book.title}" during migration`);
                  bookUrl = bookUrl.substring(0, bookUrl.length - 4);
                }
              }

              purchasedBooks.push({
                bookId: book.bookId,
                title: book.title,
                author: book.author,
                coverimage: book.coverimage,
                price: book.price,
                url: bookUrl,
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

  // Route to verify if a purchase exists
  router.get("/verify-purchase", auth, async (req, res) => {
    try {
      const { purchaseId } = req.query;
      const userId = req.user.id;

      if (!purchaseId) {
        return res.status(400).json({ error: "Missing purchase ID" });
      }

      console.log(`Verifying purchase ${purchaseId} for user ${userId}`);

      // Check if the purchase exists in the database
      const purchase = await Purchase.findOne({
        _id: purchaseId,
        userId: userId
      });

      if (purchase) {
        console.log(`Purchase ${purchaseId} found in database`);
        return res.status(200).json({
          success: true,
          message: "Purchase verified",
          purchase: {
            _id: purchase._id,
            totalAmount: purchase.totalAmount,
            purchaseDate: purchase.purchaseDate,
            bookCount: purchase.books.length
          }
        });
      }

      // If not found in Purchase collection, check user's purchasedBooks
      const user = await User.findById(userId);

      if (user && user.purchasedBooks && user.purchasedBooks.length > 0) {
        // Look for books with this payment ID
        const booksWithPaymentId = user.purchasedBooks.filter(
          book => book.paymentId && book.paymentId.includes(purchaseId)
        );

        if (booksWithPaymentId.length > 0) {
          console.log(`Found ${booksWithPaymentId.length} books with payment ID ${purchaseId} in user's purchased books`);
          return res.status(200).json({
            success: true,
            message: "Purchase verified in user's purchased books",
            purchase: {
              _id: purchaseId,
              bookCount: booksWithPaymentId.length,
              purchaseDate: booksWithPaymentId[0].purchaseDate
            }
          });
        }
      }

      // Purchase not found
      console.log(`Purchase ${purchaseId} not found for user ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Purchase not found"
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });

  // Route to verify a Stripe session
  router.get("/verify-session", auth, async (req, res) => {
    try {
      const { sessionId } = req.query;
      const userId = req.user.id;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing session ID" });
      }

      console.log(`Verifying Stripe session ${sessionId} for user ${userId}`);

      try {
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
          return res.status(404).json({
            success: false,
            message: "Stripe session not found"
          });
        }

        // Check if the session is completed
        if (session.status !== 'complete' && session.payment_status !== 'paid') {
          return res.status(400).json({
            success: false,
            message: "Payment not completed",
            status: session.status,
            paymentStatus: session.payment_status
          });
        }

        // Check if the user ID in metadata matches
        if (session.metadata && session.metadata.userId !== userId) {
          console.warn(`User ID mismatch: ${session.metadata.userId} vs ${userId}`);
          // We'll still allow this for now, but log it as a warning
        }

        // Get the purchase ID from metadata
        const purchaseId = session.metadata?.purchaseId;

        if (!purchaseId) {
          return res.status(400).json({
            success: false,
            message: "Purchase ID missing from session metadata"
          });
        }

        // Return success with session details
        return res.status(200).json({
          success: true,
          message: "Session verified",
          session: {
            id: session.id,
            purchaseId: purchaseId,
            amount: session.amount_total / 100, // Convert from cents
            paymentStatus: session.payment_status,
            customerEmail: session.customer_details?.email
          }
        });
      } catch (stripeError) {
        console.error("Stripe error:", stripeError);
        return res.status(400).json({
          success: false,
          message: "Invalid Stripe session",
          error: stripeError.message
        });
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  module.exports = router;
