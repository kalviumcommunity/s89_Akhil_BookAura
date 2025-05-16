const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { loadModel } = require('./utils/modelLoader');

// Load environment variables using our centralized utility
require('./utils/envConfig');

// Load the User model using our utility
const User = loadModel('userModel');

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://s89-akhil-bookaura-3.onrender.com/router/auth/google/callback",
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google Profile received:', profile.id);
        console.log('Google email:', profile.emails[0].value);
        console.log('Google display name:', profile.displayName);

        if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            console.error('No email found in Google profile');
            return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists by email
        let user = await User.findOne({ email: profile.emails[0].value });
        console.log('Existing user found by email:', user ? 'Yes' : 'No');

        // Also check if user exists by googleId
        if (!user) {
            const userByGoogleId = await User.findOne({ googleId: profile.id });
            if (userByGoogleId) {
                console.log('User found by googleId instead of email');
                user = userByGoogleId;
            }
        }

        if (!user) {
            // Create new user
            console.log('Creating new user with Google credentials');

            // Generate a unique username if needed
            let username = profile.displayName;
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                // Add a random suffix to make username unique
                username = `${profile.displayName}_${Math.floor(Math.random() * 10000)}`;
            }

            user = new User({
                username: username,
                email: profile.emails[0].value,
                googleId: profile.id,
                profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined
            });

            try {
                await user.save();
                console.log('New user created successfully:', user._id);
            } catch (saveError) {
                console.error('Error saving new user:', saveError);
                return done(saveError, null);
            }
        } else if (!user.googleId) {
            // Update existing user with Google ID
            console.log('Updating existing user with Google ID');
            user.googleId = profile.id;

            // Update profile image if not already set
            if (profile.photos && profile.photos[0] && (!user.profileImage || user.profileImage.includes('blank-profile-picture'))) {
                user.profileImage = profile.photos[0].value;
            }

            try {
                await user.save();
                console.log('User updated with Google ID');
            } catch (updateError) {
                console.error('Error updating user with Google ID:', updateError);
                return done(updateError, null);
            }
        } else {
            console.log('Existing Google user found, proceeding with authentication');
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