const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");

// Models
const User = require("../models/User");

// Utilities
const { createAccessCode } = require("../utilities/createAccessCode");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${
        process.env.NODE_ENV === "development"
          ? process.env.DEVELOPMENT_API_URL
          : process.env.PRODUCTION_API_URL
      }/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const existingUser = await User.findOneAndUpdate(
        { googleID: profile.id },
        {
          accessToken,
          refreshToken,
          name: profile.displayName,
          profilePic: profile.photos[profile.photos.length - 1].value,
          usesGoogleAuth: true,
          emailConfirmed: profile.emails[0].verified,
        }
      );

      if (existingUser) {
        return done(null, existingUser);
      }

      const user = await new User({
        accessToken,
        refreshToken,
        name: profile.displayName,
        profilePic: profile.photos[profile.photos.length - 1].value,
        email: profile.emails[0].value,
        username: profile.emails[0].value,
        googleID: profile.id,
        usesGoogleAuth: true,
        emailConfirmed: profile.emails[0].verified,
        createdAt: new Date().toISOString(),
        hasAccess: process.env.ACCESS_CODE_REQUIRED === "true" ? false : true,
      }).save();

      // Create 4 access codes for the user

      for (let i = 0; i < 4; i++) {
        await createAccessCode(user._id, true);
      }
      done(null, user);
    }
  )
);
