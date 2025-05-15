const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verifyToken } = require("../middleware/auth");
const { loadModel } = require("../utils/modelLoader");
const Purchase = loadModel("PurchaseModel");
const User = loadModel("userModel");
const mongoose = require("mongoose");

// Create Stripe Checkout session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { book, books } = req.body;
    let lineItems = [];

    if (books?.length) {
      lineItems = books.map(b => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: b.title,
            description: `By ${b.author}`,
            images: [b.coverimage],
          },
          unit_amount: b.price * 100,
        },
        quantity: 1,
      }));
    } else if (book) {
      lineItems = [{
        price_data: {
          currency: "inr",
          product_data: {
            name: book.title,
            description: `By ${book.author}`,
            images: [book.coverimage],
          },
          unit_amount: book.price * 100,
        },
        quantity: 1,
      }];
    } else {
      return res.status(400).json({ error: "No books provided" });
    }

    const totalAmount = (books || [book]).reduce((sum, b) => sum + b.price, 0);
    const purchaseId = new mongoose.Types.ObjectId();

    // Get frontend URL from environment variable or use default
    const frontendUrl = process.env.FRONTEND_URL || 'https://bookauraba.netlify.app';

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchaseId}`,
      cancel_url: `${frontendUrl}/cancel`,
      metadata: {
        purchaseId: purchaseId.toString(),
        userId: req.user.id,
        totalAmount: totalAmount.toString()
      }
    });

    req.session.pendingPurchase = {
      _id: purchaseId,
      userId: req.user.id,
      books: books || [book],
      totalAmount,
      paymentStatus: 'pending'
    };

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Save purchase after payment success
router.post("/save-purchase", async (req, res) => {
  try {
    const { sessionId, purchaseId, books, userId: bodyUserId } = req.body;

    // First try to get userId from the authenticated user
    let userId = req.user?.id;

    // If no authenticated user, try to get userId from request body
    if (!userId && bodyUserId) {
      userId = bodyUserId;
      console.log('Using userId from request body:', userId);
    }

    // If still no userId, try to get it from the session metadata via Stripe
    if (!userId && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session && session.metadata && session.metadata.userId) {
          userId = session.metadata.userId;
          console.log('Retrieved userId from Stripe session metadata:', userId);
        }
      } catch (stripeError) {
        console.error('Error retrieving session from Stripe:', stripeError);
      }
    }

    // Final validation check
    if (!userId || !purchaseId || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        details: {
          hasUserId: !!userId,
          hasPurchaseId: !!purchaseId,
          booksValid: Array.isArray(books) && books.length > 0
        }
      });
    }

    console.log('Processing purchase for userId:', userId, 'purchaseId:', purchaseId);
    const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];

    const processedBooks = books.map(book => {
      const missing = requiredFields.filter(field => !book[field]);
      if (missing.length) throw new Error(`Book is missing fields: ${missing.join(', ')}`);

      let url = book.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      if (url.includes('cloudinary.com') && url.includes('raw') && url.endsWith('.pdf')) {
        url = url.slice(0, -4);
      }
      return { ...book, url };
    });

    const totalAmount = processedBooks.reduce((sum, b) => sum + b.price, 0);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existingBookIds = new Set(user.purchasedBooks?.map(b => b.bookId.toString()) || []);
    const newBooks = processedBooks.filter(b => !existingBookIds.has(b._id.toString())).map(b => ({
      bookId: b._id,
      title: b.title,
      author: b.author,
      coverimage: b.coverimage,
      price: b.price,
      url: b.url,
      purchaseDate: new Date(),
      paymentId: sessionId || 'dev-session'
    }));

    user.purchasedBooks = [...(user.purchasedBooks || []), ...newBooks];
    await user.save();

    const purchase = new Purchase({
      _id: purchaseId,
      userId,
      books: processedBooks.map(b => ({
        bookId: b._id,
        title: b.title,
        author: b.author,
        coverimage: b.coverimage,
        price: b.price,
        url: b.url
      })),
      totalAmount,
      paymentId: sessionId || 'dev-session',
      purchaseDate: new Date()
    });

    await purchase.save();
    res.status(201).json({ success: true, message: "Purchase saved", purchaseId });
  } catch (error) {
    res.status(500).json({ error: "Failed to save purchase", message: error.message });
  }
});

// Fetch user purchases - with improved error handling
router.get("/my-purchases", verifyToken, async (req, res) => {
  try {
    console.log('Fetching purchases for user:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('No user ID found in request');
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to view your purchased books"
      });
    }

    // Try to find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({
        error: "User not found",
        message: "We couldn't find your user account. Please try logging in again."
      });
    }

    // Check if user has purchased books in their profile
    if (!user.purchasedBooks?.length) {
      console.log('No purchased books in user profile, checking Purchase collection');

      // If not, try to find purchases in the Purchase collection
      try {
        const purchases = await Purchase.find({ userId: req.user.id }).sort({ purchaseDate: -1 });

        if (!purchases.length) {
          console.log('No purchases found for user:', req.user.id);
          return res.status(200).json({ success: true, purchasedBooks: [] });
        }

        console.log(`Found ${purchases.length} purchases in Purchase collection`);

        // Migrate books from purchases to user profile
        const migratedBooks = purchases.flatMap(purchase => purchase.books.map(b => ({
          bookId: b.bookId,
          title: b.title,
          author: b.author,
          coverimage: b.coverimage,
          price: b.price,
          url: b.url?.endsWith('.pdf') ? b.url.slice(0, -4) : b.url,
          purchaseDate: b.purchaseDate || purchase.purchaseDate,
          paymentId: purchase.paymentId
        })));

        console.log(`Migrated ${migratedBooks.length} books to user profile`);

        // Update user profile with migrated books
        user.purchasedBooks = migratedBooks;
        user.lastPurchaseDate = purchases[0].purchaseDate;
        await user.save();

        console.log('User profile updated with purchased books');
      } catch (purchaseError) {
        console.error('Error finding purchases:', purchaseError);
        // Continue with empty purchased books rather than failing
        user.purchasedBooks = [];
      }
    }

    // Ensure purchasedBooks is always an array
    const purchasedBooks = user.purchasedBooks || [];
    console.log(`Returning ${purchasedBooks.length} purchased books`);

    // Fix any missing or invalid URLs
    const processedBooks = purchasedBooks.map(book => {
      // Ensure the book has all required fields
      return {
        ...book.toObject ? book.toObject() : book,
        url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
      };
    });

    res.status(200).json({
      success: true,
      purchasedBooks: processedBooks,
      count: processedBooks.length
    });
  } catch (error) {
    console.error('Error fetching purchased books:', error);
    res.status(500).json({
      error: "Failed to fetch purchased books",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verify purchase by ID - No authentication required
router.get("/verify-purchase", async (req, res) => {
  try {
    const { purchaseId, userId: queryUserId } = req.query;
    console.log('Verifying purchase:', purchaseId);

    // Try to get userId from different sources
    let userId = req.user?.id || queryUserId;

    if (!purchaseId) {
      console.log('Missing purchase ID');
      return res.status(400).json({ error: "Missing purchase ID" });
    }

    // If we have a userId, try to find the purchase for that user
    if (userId) {
      console.log('Checking purchase for user:', userId);
      const purchase = await Purchase.findOne({ _id: purchaseId, userId });

      if (purchase) {
        console.log('Purchase found for user:', userId);
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

      const user = await User.findById(userId);
      const userBooks = user?.purchasedBooks?.filter(b => b.paymentId?.includes(purchaseId)) || [];

      if (userBooks.length) {
        console.log('Purchase found in user books for user:', userId);
        return res.status(200).json({
          success: true,
          message: "Purchase verified from user books",
          purchase: {
            _id: purchaseId,
            bookCount: userBooks.length,
            purchaseDate: userBooks[0].purchaseDate
          }
        });
      }
    }

    // If no userId or purchase not found for that user, try to find the purchase by ID only
    console.log('Checking purchase by ID only:', purchaseId);
    const purchaseByIdOnly = await Purchase.findById(purchaseId);

    if (purchaseByIdOnly) {
      console.log('Purchase found by ID only. User ID:', purchaseByIdOnly.userId);
      return res.status(200).json({
        success: true,
        message: "Purchase verified by ID only",
        purchase: {
          _id: purchaseByIdOnly._id,
          userId: purchaseByIdOnly.userId, // Include userId for client to use
          totalAmount: purchaseByIdOnly.totalAmount,
          purchaseDate: purchaseByIdOnly.purchaseDate,
          bookCount: purchaseByIdOnly.books.length
        }
      });
    }

    console.log('Purchase not found:', purchaseId);
    res.status(404).json({ success: false, message: "Purchase not found" });
  } catch (error) {
    console.error('Error verifying purchase:', error.message);
    res.status(500).json({ error: "Failed to verify purchase", message: error.message });
  }
});

// Verify Stripe session - No authentication required
router.get("/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.query;
    console.log('Verifying session:', sessionId);

    if (!sessionId) {
      console.log('Missing session ID');
      return res.status(400).json({ error: "Missing session ID" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved:', session.id, 'Status:', session.status, 'Payment status:', session.payment_status);

    if (!session || (session.status !== 'complete' && session.payment_status !== 'paid')) {
      console.log('Payment not completed for session:', sessionId);
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const purchaseId = session.metadata?.purchaseId;
    const userId = session.metadata?.userId;

    if (!purchaseId) {
      console.log('Missing purchase ID in session metadata');
      return res.status(400).json({ success: false, message: "Missing purchase ID" });
    }

    console.log('Session verified successfully. Purchase ID:', purchaseId, 'User ID:', userId);

    res.status(200).json({
      success: true,
      message: "Session verified",
      session: {
        id: session.id,
        purchaseId,
        userId, // Include userId from metadata
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email
      }
    });
  } catch (error) {
    console.error('Error verifying session:', error.message);
    res.status(500).json({ error: "Failed to verify session", message: error.message });
  }
});

module.exports = router;
