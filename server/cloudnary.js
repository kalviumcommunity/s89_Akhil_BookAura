const cloudinary = require('cloudinary').v2;

// Load environment variables using our centralized utility
require('./utils/envConfig');

// Log Cloudinary configuration for debugging
console.log('Cloudinary Configuration:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;