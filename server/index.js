const express = require("express");
const passport = require("passport");
const cookieSession = require("cookie-session");
const cors = require("cors");
const connectDB = require("./config/db");
const port = process.env.PORT || 8000;

const app = express();
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? process.env.DEVELOPMENT_CLIENT_URL
        : process.env.PRODUCTION_CLIENT_URL,
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(
  cookieSession({
    maxAge: 60 * 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY],
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const rateNoteRoutes = require("./routes/rateNoteRoutes");

// Use routes
app.use("/auth", authRoutes); // Auth Routes
app.use("/notes", noteRoutes); // Note Routes
app.use("/rate-notes", rateNoteRoutes); // Rate Note Routes

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
