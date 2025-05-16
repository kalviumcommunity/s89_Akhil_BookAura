// server.js
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables using our centralized utility
require('./utils/envConfig');

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

// Log environment variables for debugging (without exposing secrets)
console.log('Server Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('- SERVER_URL:', process.env.SERVER_URL || 'Not set');
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');
console.log('- GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('- GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);

// Import passport configuration
require('./passport.config');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
// First, handle preflight requests with a simple CORS handler
app.use((req, res, next) => {
    // Only handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('Handling preflight request from:', req.headers.origin);

        // Set CORS headers for preflight requests
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Cache-Control, Pragma, X-Auth-Token, X-User-ID, X-HTTP-Method-Override');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours

        // Respond with 204 No Content for preflight requests
        return res.status(204).end();
    }

    // Continue to the next middleware for non-preflight requests
    next();
});

// Then use the regular CORS middleware for actual requests
app.use(cors({
    origin: function(origin, callback) {
        // Define allowed origins
        const allowedOrigins = [
            'http://localhost:5173',  // Local development
            'http://localhost:5174',  // Alternative local port
            'http://localhost:3000',  // Another common local port
            'http://127.0.0.1:5173',  // Local IP address
            'http://127.0.0.1:5174',  // Local IP address alternative port
            'http://127.0.0.1:3000',  // Local IP address common port
            'https://s89-akhil-book-aura.vercel.app',
            'https://s89-akhil-book-aura.netlify.app',
            'https://bookauraba.netlify.app',
            'https://bookaura.netlify.app',
            'https://bookaura.vercel.app',
            process.env.FRONTEND_URL // From environment variable if set
        ].filter(Boolean); // Remove any undefined/null values

        // Log request details for debugging
        console.log('CORS - Request origin:', origin);

        // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
        if (!origin) {
            console.log('CORS - No origin, allowing request');
            return callback(null, true);
        }

        // Check if origin is in our allowed list
        if (allowedOrigins.includes(origin)) {
            console.log('CORS - Origin explicitly allowed:', origin);
            return callback(null, true);
        }

        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            console.log('CORS - Development mode, allowing all origins');
            return callback(null, true);
        }

        // In production, we'll still allow all origins for now to prevent issues
        // but log it for monitoring
        console.log('CORS - Origin not in allowed list:', origin);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'Cache-Control',
        'Pragma',
        'X-Auth-Token',
        'X-User-ID',
        'X-HTTP-Method-Override'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Set-Cookie'],
    maxAge: 86400 // 24 hours in seconds - how long the browser should cache CORS response
}));
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies in modern browsers
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,

    proxy: process.env.NODE_ENV === 'production', // Trust the reverse proxy in production

    store: process.env.NODE_ENV === 'production'
        ? undefined
        : undefined
}}));


if (process.env.NODE_ENV === 'production' && !app.get('trust proxy')) {
    console.warn('Warning: You should set "trust proxy" when behind a reverse proxy like Nginx or when deployed to cloud platforms');
    app.set('trust proxy', 1); // Trust first proxy
}

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
