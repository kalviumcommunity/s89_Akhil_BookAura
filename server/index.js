// server.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./passport.config'); // Import passport configuration
const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.JWT_SECRET ,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routers
const userRouter = require('./routes/userRouter');
const bookRouter = require('./routes/BookRouter');
const paymentRoutes = require("./routes/Payment");
app.use("/api/payment", paymentRoutes);


app.use('/router', userRouter);
app.use('/router', bookRouter);

// Start server
app.listen(5000, async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("MongoDB connection error:", error);
    }
    console.log(`Running on server 5000`);
});
