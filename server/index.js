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

// Import passport configuration
require('./passport.config');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Define allowed origins
        const allowedOrigins = [
            'http://localhost:5173',  // Local development
            'http://localhost:5174',  // Alternative local port
            'https://s89-akhil-book-aura.vercel.app',
            'https://s89-akhil-book-aura.netlify.app',
            'https://bookauraba.netlify.app',
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
        'Cookie'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Set-Cookie'],
    maxAge: 86400, // 24 hours in seconds - how long the browser should cache CORS response
    preflightContinue: true // Allow preflight requests to pass through to the next handler
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
        path: '/', // Ensure cookie is available on all paths
        // Don't set domain to allow cookies to work across different domains
    },
    proxy: true, // Always trust the reverse proxy (needed for Render)
    // Use a more reliable session store in production
    store: process.env.NODE_ENV === 'production'
        ? undefined // In production, you might want to use a proper session store like MongoDB or Redis
        : undefined  // In development, use the default MemoryStore (with warning)
}));

// Set trust proxy for all environments when deployed
console.log('Setting trust proxy for proper handling of secure cookies behind a proxy');
app.set('trust proxy', 1); // Trust first proxy

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
const chatHistoryRouter = require('./routes/ChatHistoryRouter');
const flashcardRouter = require('./routes/FlashcardRouter');

// Log loaded routers for debugging
console.log('Loaded routers:');
console.log('- userRouter:', typeof userRouter);
console.log('- bookRouter:', typeof bookRouter);
console.log('- paymentRoutes:', typeof paymentRoutes);
console.log('- pdfProxyRoutes:', typeof pdfProxyRoutes);
console.log('- cartRouter:', typeof cartRouter);
console.log('- eventRouter:', typeof eventRouter);
console.log('- chatHistoryRouter:', typeof chatHistoryRouter);

app.use("/api/payment", paymentRoutes);
app.use("/api/pdf", pdfProxyRoutes);
app.use("/api/cart", cartRouter);
app.use("/api/events", eventRouter);
app.use("/api/chat-history", chatHistoryRouter);
app.use("/api/flashcards", flashcardRouter);

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
