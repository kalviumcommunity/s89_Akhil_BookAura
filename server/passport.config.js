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
    callbackURL: process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.SERVER_URL || 'http://localhost:5000'}/router/auth/google/callback`,
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