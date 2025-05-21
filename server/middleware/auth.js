const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and authenticate user
const verifyToken = (req, res, next) => {
    const requestPath = req.originalUrl || req.url;
    console.log(`Auth middleware - Processing request to: ${requestPath}`);
    console.log('Auth middleware - Request headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        cookie: req.headers.cookie ? 'Present' : 'Missing',
        origin: req.headers.origin
    });

    if (req.cookies) {
        console.log('Auth middleware - Cookie names:', Object.keys(req.cookies));
    }

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
        console.log('Raw cookies:', cookies.map(c => c.trim().split('=')[0]));

        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (['authToken', 'token', 'jwt'].includes(name)) {
                token = value;
                console.log('Found token in raw cookie header:', name);
                break;
            }
        }
    }

    // 4. Fallback: Passport authentication
    if (!token && req.isAuthenticated?.()) {
        console.log('User is authenticated via Passport');
        console.log('Passport user:', req.user);
        return next(); // Passport sets req.user
    }

    // 5. No token found
    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({
            message: 'Access Denied. No token provided',
            path: requestPath,
            authMethods: {
                headerPresent: !!req.headers.authorization,
                cookiesPresent: !!req.cookies,
                isAuthenticated: req.isAuthenticated?.() || false
            }
        });
    }

    // 6. Verify token
    try {
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully for user:', decoded.id);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);

        // Check for specific JWT errors
        let errorMessage = 'Invalid token';
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token has expired';
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid token format';
        } else if (error.name === 'NotBeforeError') {
            errorMessage = 'Token not yet active';
        }

        return res.status(401).json({
            message: errorMessage,
            error: error.message,
            name: error.name
        });
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
const auth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    auth,
};
//