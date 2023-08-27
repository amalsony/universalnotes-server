const axios = require("axios");

const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const connectDB = require("./config/db");
const port = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Models
const Garment = require("./models/Garment");
const mongoose = require("mongoose");

// Middleware
app.use(express.json());

// Image upload imports
const { uploadFile, deleteFile, getObjectSignedUrl } = require("./aws/s3");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");

// file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// validators
const { validateGarmentInput } = require("./utilities/validators");

// Routes

// Add garment
app.post(
  "/api/add-garment",
  upload.single("garment-image"),
  async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(400).send({
        errors: {
          message: "Please add a garment image",
        },
      });
    }

    const { type, name, brand, colors } = req.body;

    const { valid, errors } = validateGarmentInput(type, name, brand, colors);

    if (!valid) {
      return res.status(400).send({
        errors,
      });
    }

    try {
      // image name
      const imageName = generateFileName();

      if (!file.buffer) {
        return res.status(400).send({
          errors: {
            message: "Please add a garment image",
          },
        });
      }

      // create a jpeg image
      const fileBuffer = await sharp(file.buffer)
        .resize(400, 400)
        .jpeg({ quality: 80 })
        .toBuffer();

      await uploadFile(fileBuffer, imageName, file.mimetype);

      // Create a new garment and add the date and time to createdAt
      const garment = new Garment({
        ...req.body,
        createdAt: new Date().toISOString(),
        image_url: imageName,
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

      console.log(err);
    }
  }
);

app.get("/api/garments", async (req, res) => {
  try {
    const garments = await Garment.find({});
    res.status(200).json({
      success: true,
      data: garments,
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
