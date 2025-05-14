// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('./passport.config'); // Import passport configuration
const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',  // Local development
            'https://s89-akhil-book-aura.vercel.app', // Assuming this is your frontend URL
            'https://s89-akhil-book-aura.netlify.app',
            'https://bookauraba.netlify.app/',
            process.env.FRONTEND_URL // From environment variable if set
        ].filter(Boolean); // Remove any undefined/null values

        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        callback(null, true); // Temporarily allow all origins in production too
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routers
const userRouter = require('./routes/userRouter');
const bookRouter = require('./routes/BookRouter');
const paymentRoutes = require("./routes/Payment");
const pdfProxyRoutes = require("./routes/PdfProxy");
const cartRouter = require('./routes/CartRouter');
const eventRouter = require('./routes/EventRouter');
const flashcardRouter = require('./routes/FlashcardRouter');
const chatHistoryRouter = require('./routes/ChatHistoryRouter');

app.use("/api/payment", paymentRoutes);
app.use("/api/pdf", pdfProxyRoutes);
app.use("/api/cart", cartRouter);
app.use("/api/events", eventRouter);
app.use("/api/flashcards", flashcardRouter);
app.use("/api/chat-history", chatHistoryRouter);

app.use('/router', userRouter);
app.use('/router', bookRouter);

// Health check endpoint
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("MongoDB connection error:", error);
    }
    console.log(`Server running on port ${PORT}`);
});
