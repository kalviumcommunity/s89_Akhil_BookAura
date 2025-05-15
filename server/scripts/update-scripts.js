/**
 * Script to update all other scripts to use the modelLoader utility
 */

const fs = require('fs');
const path = require('path');

// Get the scripts directory
const scriptsDir = __dirname;

// List of scripts to update (excluding this one)
const scriptsToUpdate = [
  'fix-cloudinary-urls.js',
  'fix-pdf-urls.js',
  'fix-placeholder-urls.js',
  'fix-book-urls-from-books.js',
  'check-book-urls.js',
  'fix-duplicate-books.js'
];

// The old import pattern to replace
const oldImportPatterns = [
  "const User = require('../model/userModel');",
  "const Book = require('../model/BookModel');",
  "const Purchase = require('../model/PurchaseModel');"
];

// The new import pattern
const modelLoaderImport = "const { loadModel } = require('./modelHelper');";
const newModelImports = [
  "const User = loadModel('userModel');",
  "const Book = loadModel('BookModel');",
  "const Purchase = loadModel('PurchaseModel');"
];

// Update each script
for (const scriptName of scriptsToUpdate) {
  const scriptPath = path.join(scriptsDir, scriptName);
  
  // Check if the script exists
  if (!fs.existsSync(scriptPath)) {
    console.log(`Script not found: ${scriptPath}`);
    continue;
  }
  
  // Read the script content
  let content = fs.readFileSync(scriptPath, 'utf8');
  
  // Check if the script already uses the model loader
  if (content.includes("require('./modelHelper')")) {
    console.log(`Script already updated: ${scriptName}`);
    continue;
  }
  
  // Replace the old import patterns with the new ones
  let hasReplaced = false;
  for (const oldPattern of oldImportPatterns) {
    if (content.includes(oldPattern)) {
      hasReplaced = true;
      content = content.replace(oldPattern, '');
    }
  }
  
  // Add the model loader import and new model imports
  if (hasReplaced) {
    // Find the position to insert the new imports (after the last require statement)
    const lines = content.split('\n');
    let lastRequireIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(')) {
        lastRequireIndex = i;
      }
    }
    
    if (lastRequireIndex >= 0) {
      // Insert the new imports after the last require statement
      lines.splice(lastRequireIndex + 1, 0, modelLoaderImport, ...newModelImports);
      content = lines.join('\n');
      
      // Write the updated content back to the file
      fs.writeFileSync(scriptPath, content, 'utf8');
      console.log(`Updated script: ${scriptName}`);
    } else {
      console.log(`Could not find a suitable position to insert imports in: ${scriptName}`);
    }
  } else {
    console.log(`No model imports found in: ${scriptName}`);
  }
}

console.log('Script update complete!');
