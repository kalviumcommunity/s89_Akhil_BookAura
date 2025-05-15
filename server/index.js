// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Configure environment variables
dotenv.config();

// Setup Express
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Set global module paths for easier imports
global.__basedir = __dirname;
global.__modeldir = path.join(__dirname, 'model');

// Check if model directory exists
console.log('Checking model directory:', global.__modeldir);
if (fs.existsSync(global.__modeldir)) {
  console.log('Model directory exists');
  // List files in the model directory
  const files = fs.readdirSync(global.__modeldir);
  console.log('Files in model directory:', files);
} else {
  console.error('Model directory does not exist!');
}

// Import passport configuration
require('./passport.config');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',  // Local development
            'http://localhost:5174',  // Alternative local port
            'https://s89-akhil-book-aura.vercel.app',
            'https://s89-akhil-book-aura.netlify.app',
            'https://bookauraba.netlify.app',
            'https://bookauraba.netlify.app/',
            process.env.FRONTEND_URL // From environment variable if set
        ].filter(Boolean); // Remove any undefined/null values

        console.log('Request origin:', origin);
        console.log('Allowed origins:', allowedOrigins);

        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) {
            console.log('No origin, allowing request');
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('Origin allowed:', origin);
            return callback(null, true);
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('Development mode, allowing all origins');
            return callback(null, true);
        }

        console.log('Origin not in allowed list, but allowing anyway for compatibility');
        callback(null, true); // Temporarily allow all origins in production too
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
        sameSite: 'none', // Required for cross-site cookies in modern browsers
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined // Match domain in production
    },
    proxy: process.env.NODE_ENV === 'production' // Trust the reverse proxy in production
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

// Debug endpoint to check authentication status
app.get('/auth-status', (req, res) => {
    res.status(200).json({
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
        cookies: req.cookies,
        session: req.session,
        headers: {
            origin: req.headers.origin,
            referer: req.headers.referer,
            host: req.headers.host
        }
    });
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
