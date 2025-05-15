/**
 * Model Loader Utility
 *
 * This utility provides a consistent way to load models across the application,
 * handling different path structures in different environments.
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Define all possible paths where models could be located
const getPossibleModelPaths = (modelName) => {
  // Special case for userModel - directly return the path to usermodel.js
  if (modelName.toLowerCase() === 'usermodel') {
    console.log('Special case for userModel - using usermodel.js');

    // Try to find usermodel.js directly
    const baseDirectories = [
      // Current working directory paths
      path.join(process.cwd(), 'model'),
      path.join(process.cwd(), 'server', 'model'),

      // Relative paths from different starting points
      path.join(__dirname, '..', 'model'),
      path.join(__dirname, '..', '..', 'model'),

      // Absolute paths for Render
      '/opt/render/project/src/model',
      '/opt/render/project/src/server/model'
    ];

    // Check each directory for usermodel.js (lowercase)
    for (const dir of baseDirectories) {
      const usermodelPath = path.join(dir, 'usermodel.js');
      if (fs.existsSync(usermodelPath)) {
        console.log(`Found usermodel.js at ${usermodelPath}`);
        return [usermodelPath];
      }
    }

    // If lowercase version not found, try uppercase first letter
    for (const dir of baseDirectories) {
      const userModelPath = path.join(dir, 'userModel.js');
      if (fs.existsSync(userModelPath)) {
        console.log(`Found userModel.js at ${userModelPath}`);
        return [userModelPath];
      }
    }

    // If still not found, print the directory contents for debugging
    for (const dir of baseDirectories) {
      if (fs.existsSync(dir)) {
        console.log(`Files in ${dir}:`, fs.readdirSync(dir));
      }
    }
  }

  // Define model name variations to handle case sensitivity
  const modelNameVariations = [
    modelName,                                                    // Original
    modelName.toLowerCase(),                                      // All lowercase
    modelName.toUpperCase(),                                      // All uppercase
    modelName.charAt(0).toUpperCase() + modelName.slice(1),       // Pascal case
    modelName.charAt(0).toLowerCase() + modelName.slice(1),       // Camel case
    // Special case for userModel/usermodel
    modelName.toLowerCase() === 'usermodel' ? 'userModel' : null, // Explicit userModel
    modelName.toLowerCase() === 'usermodel' ? 'usermodel' : null  // Explicit usermodel
  ].filter(Boolean); // Remove null entries

  // Base directories to search
  const baseDirectories = [
    // Current working directory paths
    path.join(process.cwd(), 'model'),
    path.join(process.cwd(), 'server', 'model'),

    // Relative paths from different starting points
    path.join(__dirname, '..', 'model'),
    path.join(__dirname, '..', '..', 'model'),

    // Absolute paths for Render
    '/opt/render/project/src/model',
    '/opt/render/project/src/server/model'
  ];

  // Generate all possible paths with all name variations
  const allPaths = [];

  // For each base directory, try all model name variations
  baseDirectories.forEach(dir => {
    modelNameVariations.forEach(name => {
      // Without .js extension
      allPaths.push(path.join(dir, name));
      // With .js extension
      allPaths.push(path.join(dir, `${name}.js`));
    });
  });

  return allPaths;
};

/**
 * Load a model by name
 * @param {string} modelName - The name of the model file without extension
 * @returns {Object} The loaded model
 */
const loadModel = (modelName) => {
  const possiblePaths = getPossibleModelPaths(modelName);

  console.log(`Attempting to load model: ${modelName}`);
  console.log('Current directory:', process.cwd());
  console.log('__dirname:', __dirname);

  // Check for case-insensitive matches in the model directory
  const modelDir = path.join(process.cwd(), 'model');
  const serverModelDir = path.join(process.cwd(), 'server', 'model');

  // Try both model directories
  const modelDirs = [modelDir, serverModelDir];

  for (const dir of modelDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        console.log(`Files in model directory (${dir}):`, files);

        // Look for case-insensitive matches
        const lowerModelName = modelName.toLowerCase();
        for (const file of files) {
          if (file.toLowerCase() === `${lowerModelName}.js`) {
            const exactPath = path.join(dir, file);
            console.log(`Found case-insensitive match: ${exactPath}`);
            try {
              const model = require(exactPath);
              console.log(`Successfully loaded model from case-insensitive match: ${exactPath}`);
              return model;
            } catch (err) {
              console.error(`Error loading from case-insensitive match: ${exactPath}`, err);
            }
          }
        }
      } catch (err) {
        console.error(`Error reading model directory (${dir}):`, err);
      }
    }
  }

  // Try each path
  for (const pathToTry of possiblePaths) {
    try {
      console.log(`Checking path: ${pathToTry}`);

      // Check if file exists (for paths without .js extension)
      if (!pathToTry.endsWith('.js') && !fs.existsSync(`${pathToTry}.js`)) {
        continue;
      }

      // Try to require the model
      const model = require(pathToTry);
      console.log(`Successfully loaded model ${modelName} from: ${pathToTry}`);
      return model;
    } catch (err) {
      // Just continue to the next path
    }
  }

  // If we get here, we couldn't find the model
  console.error(`Could not find model: ${modelName}`);
  console.error('Tried the following paths:');
  possiblePaths.forEach(p => console.error(`- ${p}`));

  // For User model, create a placeholder to prevent crashes
  if (modelName.toLowerCase() === 'usermodel') {
    console.log('Creating placeholder User model');

    // Check if the model is already registered with mongoose
    if (mongoose.models.User) {
      console.log('Using existing User model from mongoose registry');
      return mongoose.models.User;
    }

    // Try to require the model directly using require
    try {
      console.log('Trying to require usermodel.js directly');
      const UserModel = require('../model/usermodel');
      console.log('Successfully required usermodel.js directly');
      return UserModel;
    } catch (err) {
      console.error('Failed to require usermodel.js directly:', err.message);

      try {
        console.log('Trying to require userModel.js directly');
        const UserModel = require('../model/userModel');
        console.log('Successfully required userModel.js directly');
        return UserModel;
      } catch (err) {
        console.error('Failed to require userModel.js directly:', err.message);
      }
    }

    // Create a comprehensive user schema as a fallback
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true },
      email: { type: String, required: true },
      password: { type: String },
      googleId: { type: String },
      profileImage: { type: String, default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' },
      cartItems: [{
        bookId: { type: mongoose.Schema.Types.ObjectId },
        title: String,
        author: String,
        price: Number,
        coverimage: String,
        quantity: { type: Number, default: 1 },
        addedAt: { type: Date, default: Date.now }
      }],
      purchasedBooks: [{
        bookId: { type: mongoose.Schema.Types.ObjectId },
        title: String,
        author: String,
        coverimage: String,
        price: Number,
        url: String,
        purchaseDate: { type: Date, default: Date.now },
        paymentId: String
      }],
      userType: { type: String, enum: ['admin', 'user'], default: 'user' },
      createdAt: { type: Date, default: Date.now }
    });

    console.log('Created comprehensive User model schema as fallback');
    return mongoose.model('User', userSchema);
  }

  // For Book model, create a placeholder
  if (modelName.toLowerCase() === 'bookmodel') {
    console.log('Creating placeholder Book model');

    if (mongoose.models.Book) {
      return mongoose.models.Book;
    }

    // Try to require the model directly using require
    try {
      console.log('Trying to require BookModel.js directly');
      const BookModel = require('../model/BookModel');
      console.log('Successfully required BookModel.js directly');
      return BookModel;
    } catch (err) {
      console.error('Failed to require BookModel.js directly:', err.message);
    }

    const bookSchema = new mongoose.Schema({
      title: { type: String, required: true },
      author: { type: String, required: true },
      description: String,
      genre: String,
      price: { type: Number, required: true },
      coverimage: { type: String, required: true },
      url: String,
      categories: [String],
      isBestSeller: { type: Boolean, default: false },
      isFeatured: { type: Boolean, default: false },
      isNewRelease: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    return mongoose.model('Book', bookSchema);
  }

  // For Purchase model, create a placeholder
  if (modelName.toLowerCase() === 'purchasemodel') {
    console.log('Creating placeholder Purchase model');

    if (mongoose.models.Purchase) {
      return mongoose.models.Purchase;
    }

    // Try to require the model directly using require
    try {
      console.log('Trying to require PurchaseModel.js directly');
      const PurchaseModel = require('../model/PurchaseModel');
      console.log('Successfully required PurchaseModel.js directly');
      return PurchaseModel;
    } catch (err) {
      console.error('Failed to require PurchaseModel.js directly:', err.message);
    }

    const purchaseSchema = new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      books: [{
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
          required: true
        },
        title: {
          type: String,
          required: true
        },
        author: {
          type: String,
          required: true
        },
        coverimage: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        purchaseDate: {
          type: Date,
          default: Date.now
        }
      }],
      totalAmount: {
        type: Number,
        required: true
      },
      paymentId: {
        type: String
      },
      purchaseDate: {
        type: Date,
        default: Date.now
      }
    });

    return mongoose.model('Purchase', purchaseSchema);
  }

  // For other models, throw an error
  throw new Error(`Could not find model: ${modelName}`);
};

module.exports = {
  loadModel
};
