// Simple script to check environment variables
require('dotenv').config();

console.log('Environment Variables Check:');
console.log('============================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || 'Not set');
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');
console.log('SERVER_URL:', process.env.SERVER_URL || 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'Not set');
console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

// Check for any variables with "YOUR_" prefix (which might indicate they haven't been properly set)
const envVars = Object.keys(process.env);
const yourPrefixVars = envVars.filter(key => key.startsWith('YOUR_'));
if (yourPrefixVars.length > 0) {
  console.log('\nWARNING: Found environment variables with "YOUR_" prefix:');
  yourPrefixVars.forEach(key => {
    console.log(`- ${key}`);
  });
  console.log('These should be renamed to remove the "YOUR_" prefix.');
}

// Check for Google OAuth configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\nGoogle OAuth appears to be properly configured.');
} else {
  console.log('\nWARNING: Google OAuth is not properly configured:');
  if (!process.env.GOOGLE_CLIENT_ID) console.log('- GOOGLE_CLIENT_ID is missing');
  if (!process.env.GOOGLE_CLIENT_SECRET) console.log('- GOOGLE_CLIENT_SECRET is missing');
}

// Print the actual values of critical variables (for debugging only, remove in production)
console.log('\nCritical Variable Values (for debugging):');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('SERVER_URL:', process.env.SERVER_URL);
