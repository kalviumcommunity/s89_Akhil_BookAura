const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Check for token in Authorization header
  let token = req.header('Authorization')?.split(' ')[1];

  // If no token in header, check cookies
  if (!token && req.cookies) {
    // Check both possible cookie names
    token = req.cookies.authToken || req.cookies.token;
  }

  if (!token) {
    console.log('No token found in request');
    // Continue without user authentication - we'll handle this in the route
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    // Continue without user authentication
    req.user = null;
    next();
  }
};

module.exports = verifyToken;
