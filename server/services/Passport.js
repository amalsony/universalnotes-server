const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/User");

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
      callbackURL: "http://localhost:8000/auth/google/callback",
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
      }).save();

      done(null, user);
    }
  )
);
