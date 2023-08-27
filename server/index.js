const axios = require("axios");

const express = require("express");
const app = express();
const connectDB = require("./config/db");
const port = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Models
const Garment = require("./models/Garment");
const mongoose = require("mongoose");

// Middleware
app.use(express.json());

// Routes

// Add garment
app.post("/api/add-garment", async (req, res) => {
  try {
    // Create a new garment and add the date and time to createdAt
    const garment = new Garment({
      ...req.body,
      createdAt: new Date().toISOString(),
    });

    // Save the garment to the database
    await garment.save();

    res.status(201).json({
      success: true,
      data: garment,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
