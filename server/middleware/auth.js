const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Log request details for debugging
    console.log('Auth middleware - Request headers:', {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        origin: req.headers.origin
    });
    console.log('Auth middleware - Request cookies:', req.cookies);

    // Check for token in Authorization header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Found token in Authorization header');
    }

    // If no token in header, check cookies
    if (!token && req.cookies) {
        // Check all possible cookie names
        token = req.cookies.authToken || req.cookies.token || req.cookies.jwt;
        if (token) {
            console.log('Found token in cookies');
        }
    }

    // If still no token, check for raw cookies in the header
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'authToken' || name === 'token' || name === 'jwt') {
                token = value;
                console.log('Found token in raw cookie header');
                break;
            }
        }
    }

    // Check if user is authenticated via Passport
    if (!token && req.isAuthenticated && req.isAuthenticated()) {
        console.log('User is authenticated via Passport');
        req.user = req.user || {};
        return next();
    }

    if (!token) {
        console.log('No token found in request');
        return res.status(401).send({message: "Access Denied. No token provided"});
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully');
        req.user = verified;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).send({message: "Invalid token", error});
    }
}

// Middleware to verify admin privileges
const verifyAdmin = (req, res, next) => {
    // First verify that the user is authenticated
    verifyToken(req, res, (err) => {
        if (err) {
            return res.status(401).json({ message: "Authentication failed", error: err.message });
        }

        // Then check if the user is an admin
        if (req.user && req.user.userType === 'admin') {
            return next();
        } else {
            return res.status(403).json({ message: "Access Denied. Admin access required" });
        }
    });
}

module.exports = { verifyToken, verifyAdmin };