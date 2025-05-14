const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

// Use the global model directory path set in index.js
let User;
try {
  // If global.__modeldir is defined, use it
  if (global.__modeldir) {
    User = require(path.join(global.__modeldir, 'userModel'));
    console.log('Loaded User model from global.__modeldir');
  } else {
    // Try different paths as fallbacks
    try {
      User = require('./model/userModel');
      console.log('Loaded User model from ./model/userModel');
    } catch (error) {
      try {
        User = require('../model/userModel');
        console.log('Loaded User model from ../model/userModel');
      } catch (error2) {
        try {
          // Absolute path as a last resort
          const absolutePath = path.join(__dirname, 'model', 'userModel');
          User = require(absolutePath);
          console.log('Loaded User model from absolute path:', absolutePath);
        } catch (error3) {
          console.error('Failed to load User model:', error3);
          // Create a placeholder User model to prevent crashes
          const mongoose = require('mongoose');
          const userSchema = new mongoose.Schema({});
          User = mongoose.model('User', userSchema);
          console.log('Created placeholder User model');
        }
      }
    }
  }
} catch (error) {
  console.error('Error loading User model:', error);
}

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.YOUR_GOOGLE_CLIENT_ID,
    clientSecret: process.env.YOUR_GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/router/auth/google/callback",
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google Profile:', profile);

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            // Create new user
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });
            await user.save();
        } else if (!user.googleId) {
            // Update existing user with Google ID
            user.googleId = profile.id;
            await user.save();
        }

        return done(null, user);
    } catch (err) {
        console.error('Error in Google Strategy:', err);
        return done(err, null);
    }
}));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});