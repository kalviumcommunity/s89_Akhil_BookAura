/**
 * Model Helper for Scripts
 * 
 * This utility provides a consistent way to load models in scripts,
 * handling different path structures in different environments.
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

/**
 * Load a model by name
 * @param {string} modelName - The name of the model file without extension
 * @returns {Object} The loaded model
 */
const loadModel = (modelName) => {
  // Special case for BookModel - use Book.js from models directory
  if (modelName === 'BookModel') {
    const bookPaths = [
      path.join(__dirname, '..', 'models', 'Book.js'),
      path.join(process.cwd(), 'server', 'models', 'Book.js'),
      `/opt/render/project/src/server/models/Book.js`
    ];

    for (const bookPath of bookPaths) {
      try {
        const model = require(bookPath);
        console.log(`Successfully loaded BookModel from: ${bookPath}`);
        return model;
      } catch (err) {
        // Continue to next path
      }
    }
  }

  // Define all possible paths where the model could be located
  const possiblePaths = [
    // Try models directory first (new location)
    path.join(process.cwd(), 'models', `${modelName}`),
    path.join(process.cwd(), 'server', 'models', `${modelName}`),
    path.join(__dirname, '..', 'models', `${modelName}`),
    path.join(__dirname, '..', '..', 'models', `${modelName}`),

    // Try model directory (old location)
    path.join(process.cwd(), 'model', `${modelName}`),
    path.join(process.cwd(), 'server', 'model', `${modelName}`),
    path.join(__dirname, '..', 'model', `${modelName}`),
    path.join(__dirname, '..', '..', 'model', `${modelName}`),

    // Absolute paths for Render
    `/opt/render/project/src/models/${modelName}`,
    `/opt/render/project/src/server/models/${modelName}`,
    `/opt/render/project/src/model/${modelName}`,
    `/opt/render/project/src/server/model/${modelName}`,

    // Additional paths with .js extension
    path.join(process.cwd(), 'models', `${modelName}.js`),
    path.join(process.cwd(), 'server', 'models', `${modelName}.js`),
    path.join(process.cwd(), 'model', `${modelName}.js`),
    path.join(process.cwd(), 'server', 'model', `${modelName}.js`),
    path.join(__dirname, '..', 'models', `${modelName}.js`),
    path.join(__dirname, '..', 'model', `${modelName}.js`),
    path.join(__dirname, '..', '..', 'models', `${modelName}.js`),
    path.join(__dirname, '..', '..', 'model', `${modelName}.js`),
    `/opt/render/project/src/models/${modelName}.js`,
    `/opt/render/project/src/server/models/${modelName}.js`,
    `/opt/render/project/src/model/${modelName}.js`,
    `/opt/render/project/src/server/model/${modelName}.js`
  ];
  
  // Try each path
  for (const pathToTry of possiblePaths) {
    try {
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
  throw new Error(`Could not find model: ${modelName}`);
};

module.exports = {
  loadModel
};
