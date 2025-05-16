const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { loadModel } = require('./utils/modelLoader');

// Load environment variables using our centralized utility
require('./utils/envConfig');

// Load the User model using our utility
const User = loadModel('userModel');

// Log environment variables for debugging (without exposing secrets)
console.log('Google OAuth Configuration:');
console.log('- GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('- GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('- GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set');
console.log('- SERVER_URL:', process.env.SERVER_URL || 'Not set');

// Only configure Google Strategy if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Configuring Google OAuth Strategy with provided credentials');

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: (req) => {
            const host = req.headers.host;

            if (process.env.GOOGLE_CALLBACK_URL) {
                return process.env.GOOGLE_CALLBACK_URL;
            }

            if (host.includes('localhost') || host.includes('127.0.0.1')) {
                return `http://${host}/router/auth/google/callback`;
            }

            const serverUrl = process.env.SERVER_URL || 'https://s89-akhil-bookaura-3.onrender.com';
            console.log('Using callback URL:', `${serverUrl}/router/auth/google/callback`);
            return `${serverUrl}/router/auth/google/callback`;
        },
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google Profile:', profile);

            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                user = new User({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                });
                await user.save();
            } else if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            console.error('Error in Google Strategy:', err);
            return done(err, null);
        }
    }));
} else {
    console.log('Google OAuth Strategy not configured - missing credentials');
}

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
