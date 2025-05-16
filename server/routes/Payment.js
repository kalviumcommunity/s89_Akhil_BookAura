const express = require("express");
const router = express.Router();

// Load environment variables using our centralized utility
require('../utils/envConfig');
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

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
router.post("/save-purchase", verifyToken, async (req, res) => {
  try {
    const { sessionId, purchaseId, books } = req.body;
    if (!req.user?.id || !purchaseId || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const userId = req.user.id;
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

// Fetch user purchases
router.get("/my-purchases", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.purchasedBooks?.length) {
      const purchases = await Purchase.find({ userId: req.user.id }).sort({ purchaseDate: -1 });
      if (!purchases.length) return res.status(200).json({ success: true, purchasedBooks: [] });

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

      user.purchasedBooks = migratedBooks;
      user.lastPurchaseDate = purchases[0].purchaseDate;
      await user.save();
    }

    res.status(200).json({ success: true, purchasedBooks: user.purchasedBooks });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch purchased books" });
  }
});

// Verify purchase by ID
router.get("/verify-purchase", verifyToken, async (req, res) => {
  try {
    const { purchaseId } = req.query;
    const userId = req.user.id;
    if (!purchaseId) return res.status(400).json({ error: "Missing purchase ID" });

    const purchase = await Purchase.findOne({ _id: purchaseId, userId });
    if (purchase) {
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

    res.status(404).json({ success: false, message: "Purchase not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify purchase" });
  }
});

// Verify Stripe session
router.get("/verify-session", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "Missing session ID" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.status !== 'complete' && session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const purchaseId = session.metadata?.purchaseId;
    if (!purchaseId) return res.status(400).json({ success: false, message: "Missing purchase ID" });

    res.status(200).json({
      success: true,
      message: "Session verified",
      session: {
        id: session.id,
        purchaseId,
        amount: session.amount_total / 100,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify session" });
  }
});

module.exports = router;
