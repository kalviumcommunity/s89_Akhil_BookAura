/**
 * Script Helper
 * 
 * This utility provides common functionality for scripts,
 * including environment variable loading and database connection.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Loads environment variables for scripts
 */
function loadEnv() {
  // Try to find the .env file in various locations
  const possibleEnvPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server/.env')
  ];

  let envLoaded = false;
  
  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment variables from ${envPath}`);
      dotenv.config({ path: envPath });
      envLoaded = true;
      break;
    }
  }
  
  if (!envLoaded) {
    console.warn('No .env file found. Using default dotenv behavior.');
    dotenv.config();
  }
}

/**
 * Connects to MongoDB using the MONGODB_URI from environment variables
 * @returns {Promise} Mongoose connection promise
 */
async function connectToMongoDB() {
  // Get MongoDB URI from environment variables
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not defined');
    console.log('Using fallback connection string...');
    // Fallback connection string
    MONGODB_URI = 'mongodb://localhost:27017/bookaura';
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

/**
 * Closes the MongoDB connection
 */
async function closeMongoDB() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
}

// Load environment variables when this module is imported
loadEnv();

module.exports = {
  loadEnv,
  connectToMongoDB,
  closeMongoDB
};
