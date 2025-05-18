const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and authenticate user
const verifyToken = (req, res, next) => {
    console.log('Auth middleware - Request headers:', {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
        origin: req.headers.origin
    });
    console.log('Auth middleware - Request cookies:', req.cookies);

    let token;

    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Found token in Authorization header');
    }

    // 2. Try common cookie names
    if (!token && req.cookies) {
        token = req.cookies.authToken || req.cookies.token || req.cookies.jwt;
        if (token) {
            console.log('Found token in cookies');
        }
    }

    // 3. Try raw cookie header
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (['authToken', 'token', 'jwt'].includes(name)) {
                token = value;
                console.log('Found token in raw cookie header');
                break;
            }
        }
    }

    // 4. Fallback: Passport authentication
    if (!token && req.isAuthenticated?.()) {
        console.log('User is authenticated via Passport');
        return next(); // Passport sets req.user
    }

    // 5. No token found
    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({ message: 'Access Denied. No token provided' });
    }

    // 6. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    if (req.user?.userType === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Access Denied. Admin access required' });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin
};
//