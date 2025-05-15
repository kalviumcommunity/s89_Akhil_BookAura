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
  return [
    // Direct paths
    path.join(process.cwd(), 'model', `${modelName}`),
    path.join(process.cwd(), 'server', 'model', `${modelName}`),

    // Relative paths from different starting points
    path.join(__dirname, '..', 'model', `${modelName}`),
    path.join(__dirname, '..', '..', 'model', `${modelName}`),

    // Absolute paths for Render
    `/opt/render/project/src/model/${modelName}`,
    `/opt/render/project/src/server/model/${modelName}`,

    // Additional paths with .js extension
    path.join(process.cwd(), 'model', `${modelName}.js`),
    path.join(process.cwd(), 'server', 'model', `${modelName}.js`),
    path.join(__dirname, '..', 'model', `${modelName}.js`),
    path.join(__dirname, '..', '..', 'model', `${modelName}.js`),
    `/opt/render/project/src/model/${modelName}.js`,
    `/opt/render/project/src/server/model/${modelName}.js`
  ];
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
  const modelDir = path.join(process.cwd(), 'server', 'model');
  if (fs.existsSync(modelDir)) {
    try {
      const files = fs.readdirSync(modelDir);
      console.log('Files in model directory:', files);

      // Look for case-insensitive matches
      const lowerModelName = modelName.toLowerCase();
      for (const file of files) {
        if (file.toLowerCase() === `${lowerModelName}.js`) {
          const exactPath = path.join(modelDir, file);
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
      console.error('Error reading model directory:', err);
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
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      googleId: String,
      cartItems: Array,
      purchasedBooks: Array
    });
    return mongoose.models.User || mongoose.model('User', userSchema);
  }

  throw new Error(`Could not find model: ${modelName}`);
};

module.exports = {
  loadModel
};
