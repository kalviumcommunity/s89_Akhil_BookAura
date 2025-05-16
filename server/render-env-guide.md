# Updating Environment Variables in Render

This guide will help you update the environment variables in your Render deployment to fix the Google OAuth and server URL issues.

> **Important Note**: Your application uses two different Render services:
> - Main Backend: https://s89-akhil-bookaura-3.onrender.com
> - Flashcard API: https://s89-akhil-bookaura-1.onrender.com
>
> Make sure to use the correct URL for each service.

## Steps to Update Environment Variables in Render

1. **Log in to your Render Dashboard**
   - Go to [https://dashboard.render.com/](https://dashboard.render.com/)
   - Log in with your credentials

2. **Select Your Web Service**
   - Find and click on your BookAura server service (s89-akhil-bookaura-1 or similar)

3. **Navigate to Environment Variables**
   - In the left sidebar, click on "Environment"
   - This will show you all the environment variables currently set for your service

4. **Update the Following Environment Variables**
   - Find and update these variables (or add them if they don't exist):

   ```
   SERVER_URL=https://s89-akhil-bookaura-3.onrender.com
   GOOGLE_CALLBACK_URL=https://s89-akhil-bookaura-3.onrender.com/router/auth/google/callback
   ```

   - Make sure the following variables are set with your actual credentials:
     - GOOGLE_CLIENT_ID
     - GOOGLE_CLIENT_SECRET
     - GEMINI_API_KEY

   - Make sure to remove any variables that start with `YOUR_` prefix
   - Use the actual values from your .env file for the credentials

5. **Save Changes**
   - Click the "Save Changes" button at the bottom of the page
   - Render will automatically restart your service with the new environment variables

6. **Verify the Changes**
   - After the service restarts, check the logs to make sure the environment variables are being loaded correctly
   - You should see messages like:
     ```
     SERVER_URL: https://s89-akhil-bookaura-1.onrender.com
     GOOGLE_CLIENT_ID exists: true
     GOOGLE_CLIENT_SECRET exists: true
     ```

## Updating Google Cloud Console Settings

You also need to make sure your Google OAuth credentials are correctly configured in the Google Cloud Console:

1. **Go to the Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Find and click on your OAuth 2.0 Client ID

3. **Update Authorized Redirect URIs**
   - Add or update the authorized redirect URI to:
     ```
     https://s89-akhil-bookaura-3.onrender.com/router/auth/google/callback
     ```
   - Remove any outdated URIs that don't match this URL

4. **Save Changes**
   - Click "Save" to update your OAuth credentials

## Testing the Changes

After updating both Render environment variables and Google Cloud Console settings:

1. **Restart Your Server**
   - In the Render dashboard, go to your service
   - Click "Manual Deploy" > "Deploy latest commit"

2. **Test Google OAuth**
   - Go to your application and try logging in with Google
   - The error message should no longer appear

If you still encounter issues, check the server logs in the Render dashboard for more detailed error messages.
