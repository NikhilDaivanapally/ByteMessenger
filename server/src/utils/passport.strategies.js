import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";

// Local Strategy

passport.use(
  new LocalStrategy(async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      console.log(user, email, password);
      if (!user) {
        return done(null, false, { message: "Incorrect userName." });
      }

      const isPasswordValid = await user.isPasswordCorrect(password);

      if (!isPasswordValid) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://byte-messenger-api.onrender.com/api/v1/auth/google/callback",
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/user.phonenumbers.read",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find user by email
        let user = await User.findOne({ email: profile.emails[0].value });

        // If no user, create a new one
        if (!user) {
          user = await User.create({
            userName: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            googleId: profile.id, // Store Google ID
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id); // user.id should now exist
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
