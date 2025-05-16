// Script to update environment variables in .env file
const fs = require('fs');
const path = require('path');

// Path to .env file
const envFilePath = path.join(__dirname, '.env');

// Read the current .env file
let envContent = fs.readFileSync(envFilePath, 'utf8');

// Check if the file contains YOUR_ prefixed variables
if (envContent.includes('YOUR_GOOGLE_CLIENT_ID') || envContent.includes('YOUR_GOOGLE_CLIENT_SECRET')) {
  console.log('Found YOUR_ prefixed variables in .env file. Updating...');
  
  // Replace YOUR_ prefixed variables with correct names
  envContent = envContent.replace('YOUR_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID');
  envContent = envContent.replace('YOUR_GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET');
  
  // Write the updated content back to the .env file
  fs.writeFileSync(envFilePath, envContent);
  
  console.log('Updated .env file successfully.');
} else {
  console.log('No YOUR_ prefixed variables found in .env file.');
}

// Parse the current .env file to check for Google OAuth variables
const envLines = envContent.split('\n');
let hasGoogleClientId = false;
let hasGoogleClientSecret = false;
let hasGoogleCallbackUrl = false;

for (const line of envLines) {
  if (line.startsWith('GOOGLE_CLIENT_ID=')) hasGoogleClientId = true;
  if (line.startsWith('GOOGLE_CLIENT_SECRET=')) hasGoogleClientSecret = true;
  if (line.startsWith('GOOGLE_CALLBACK_URL=')) hasGoogleCallbackUrl = true;
}

console.log('Google OAuth variables check:');
console.log('- GOOGLE_CLIENT_ID:', hasGoogleClientId ? 'Found' : 'Not found');
console.log('- GOOGLE_CLIENT_SECRET:', hasGoogleClientSecret ? 'Found' : 'Not found');
console.log('- GOOGLE_CALLBACK_URL:', hasGoogleCallbackUrl ? 'Found' : 'Not found');

// Check if the callback URL is correct
if (hasGoogleCallbackUrl) {
  for (const line of envLines) {
    if (line.startsWith('GOOGLE_CALLBACK_URL=')) {
      const url = line.split('=')[1];
      if (url.includes('s89-akhil-bookaura-3.onrender.com')) {
        console.log('GOOGLE_CALLBACK_URL contains outdated server URL. Updating...');
        
        // Update the callback URL
        const updatedLine = line.replace('s89-akhil-bookaura-3.onrender.com', 's89-akhil-bookaura-1.onrender.com');
        const updatedContent = envContent.replace(line, updatedLine);
        
        // Write the updated content back to the .env file
        fs.writeFileSync(envFilePath, updatedContent);
        
        console.log('Updated GOOGLE_CALLBACK_URL successfully.');
      } else {
        console.log('GOOGLE_CALLBACK_URL is up to date.');
      }
    }
  }
}

console.log('Environment variables update complete.');
