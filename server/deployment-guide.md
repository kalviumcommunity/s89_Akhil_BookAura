# Deployment Guide for BookAura Server

This guide will help you fix the current server issues and deploy the updated code to Render.

## Current Issues

1. **FlashcardRouter.js Error**: The server is encountering a `TypeError: argument handler must be a function` error in the FlashcardRouter.js file.
2. **Google OAuth Issues**: Google OAuth is not working correctly due to incorrect environment variables.

## Steps to Fix and Deploy

### 1. Fix the FlashcardRouter.js File

The current FlashcardRouter.js file has an issue with how it's importing and using the auth middleware. Follow these steps to fix it:

1. Rename the new file to replace the old one:
   ```
   mv server/routes/FlashcardRouter.js.new server/routes/FlashcardRouter.js
   ```

2. Alternatively, you can manually replace the content of the FlashcardRouter.js file with the content of FlashcardRouter.js.new.

### 2. Update Environment Variables in Render

1. **Log in to your Render Dashboard**
   - Go to [https://dashboard.render.com/](https://dashboard.render.com/)
   - Log in with your credentials

2. **Select Your Web Service**
   - Find and click on your BookAura server service (s89-akhil-bookaura-3)

3. **Navigate to Environment Variables**
   - In the left sidebar, click on "Environment"
   - This will show you all the environment variables currently set for your service

4. **Verify the Following Environment Variables**
   - Make sure these variables are set correctly:
   ```
   SERVER_URL=https://s89-akhil-bookaura-3.onrender.com
   GOOGLE_CALLBACK_URL=https://s89-akhil-bookaura-3.onrender.com/router/auth/google/callback
   GOOGLE_CLIENT_ID=[Your Google Client ID]
   GOOGLE_CLIENT_SECRET=[Your Google Client Secret]
   ```

5. **Save Changes**
   - Click the "Save Changes" button at the bottom of the page
   - Render will automatically restart your service with the new environment variables

### 3. Deploy the Updated Code

1. **Commit and Push Your Changes**
   ```
   git add server/routes/FlashcardRouter.js
   git commit -m "Fix FlashcardRouter middleware issue"
   git push
   ```

2. **Manual Deploy on Render**
   - In the Render dashboard, go to your service
   - Click "Manual Deploy" > "Deploy latest commit"
   - This will force Render to deploy the latest version of your code

3. **Monitor the Deployment**
   - Watch the deployment logs for any errors
   - Make sure the server starts successfully without the TypeError

### 4. Update Google Cloud Console Settings

1. **Go to the Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Find and click on your OAuth 2.0 Client ID

3. **Update Authorized Redirect URIs**
   - Make sure the authorized redirect URI is set to:
     ```
     https://s89-akhil-bookaura-3.onrender.com/router/auth/google/callback
     ```
   - Remove any outdated URIs that don't match this URL

4. **Save Changes**
   - Click "Save" to update your OAuth credentials

### 5. Test the Application

1. **Test Google OAuth**
   - Go to your application and try logging in with Google
   - The error message should no longer appear

2. **Test Flashcards Functionality**
   - Try creating and viewing flashcards
   - Make sure the flashcards are being generated correctly

## Troubleshooting

If you still encounter issues after following these steps:

1. **Check Server Logs**
   - In the Render dashboard, check the logs for any errors
   - Look for specific error messages that might help identify the issue

2. **Verify File Paths**
   - Make sure the file paths in your imports are correct
   - Case sensitivity matters in file paths on Linux servers

3. **Check for Typos**
   - Double-check for any typos in your code or environment variables
   - Even small typos can cause significant issues

4. **Restart the Server**
   - Sometimes a simple restart can fix issues
   - In the Render dashboard, click "Manual Deploy" > "Deploy latest commit"

If you continue to experience issues, please provide the specific error messages from the server logs for further assistance.
