/**
 * Centralized environment configuration utility
 * This file provides a consistent way to load environment variables across the application
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Loads environment variables from the .env file
 * Ensures that the .env file is loaded from the server directory
 */
function loadEnv() {
  // Determine the server directory path
  const serverDir = path.resolve(__dirname, '..');
  const envPath = path.join(serverDir, '.env');

  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.warn(`.env file not found at ${envPath}`);
    // Load without specifying path as fallback
    dotenv.config();
  }

  // Validate critical environment variables
  validateEnvVariables();
}

/**
 * Validates that critical environment variables are set
 * Logs warnings for missing variables
 */
function validateEnvVariables() {
  const criticalVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'FRONTEND_URL'
  ];

  const missingVars = criticalVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('WARNING: The following critical environment variables are not set:');
    missingVars.forEach(varName => console.warn(`- ${varName}`));
  }
}

// Load environment variables when this module is imported
loadEnv();

module.exports = {
  loadEnv,
  validateEnvVariables
};
