const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const connectDB = require("./config/db");
const port = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const garmentRoutes = require("./routes/garmentRoutes");
const outfitRoutes = require("./routes/outfitRoutes");
const userRoutes = require("./routes/userRoutes");

// Use routes
app.use("/auth", authRoutes); // Auth Routes
app.use("/garments", garmentRoutes); // Garment Routes
app.use("/outfits", outfitRoutes); // Outfit Routes
app.use("/user", userRoutes); // User Routes

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
