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

// AI imports
const generateOutfit = require("./openai/generate");
const { get } = require("http");

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

    const { name, brand, colors } = req.body;

    const { valid, errors } = validateGarmentInput(name, brand, colors);

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
    }
  }
);

app.get("/api/garments", async (req, res) => {
  try {
    const databaseGarments = await Garment.find({}).sort({ createdAt: -1 });

    // for each garment, get the signed url
    const garments = await Promise.all(
      databaseGarments.map(async (garment) => {
        const signedUrl = await getObjectSignedUrl(garment.image_url);
        return {
          ...garment._doc,
          image_url: signedUrl,
        };
      })
    );

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

// get a single garment
app.get("/api/garment/:id", async (req, res) => {
  try {
    const garment = await Garment.findById(req.params.id);

    if (!garment) {
      return res.status(404).json({
        success: false,
        error: "Garment not found",
      });
    }

    const signedUrl = await getObjectSignedUrl(garment.image_url);

    res.status(200).json({
      success: true,
      data: {
        ...garment._doc,
        image_url: signedUrl,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

app.post("/api/generate-outfit", async (req, res) => {
  try {
    const { prompt } = req.body;

    const userGarments = await Garment.find({});

    // create a new array of garments with the _id, name, colors, brand and type
    const garments = userGarments.map((garment) => {
      return {
        _id: garment._id,
        name: garment.name,
        colors: garment.colors,
        brand: garment.brand,
        type: garment.type,
      };
    });

    let request = {
      prompt: prompt.toString(),
      garments,
    };
    request = JSON.stringify(request);

    const data = JSON.parse(await generateOutfit(request));
    const caption = data.caption;

    // fetch the garments from the database
    const sendOutfit = await Promise.all(
      data.outfit.map(async (garment) => {
        const databaseGarment = await Garment.findById(garment.id);

        if (!databaseGarment) {
          return res.status(404).json({
            success: false,
            error: "Garment not found",
          });
        }

        const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);

        return {
          // get type from generateOutfit function
          type: garment.category,
          name: databaseGarment.name,
          brand: databaseGarment.brand,
          colors: databaseGarment.colors,
          image_url: signedUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        outfit: sendOutfit,
        caption,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

app.post("/api/get-example-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("request received");

    const userGarments = await Garment.find({});

    console.log("garments fetched");

    // create a new array of garments with the _id, name, colors, brand and type
    const garments = userGarments.map((garment) => {
      return {
        _id: garment._id,
        name: garment.name,
        colors: garment.colors,
        brand: garment.brand,
      };
    });

    let request = {
      prompt: prompt.toString(),
      garments,
    };
    request = JSON.stringify(request);

    res.status(200).json({
      success: true,
      data: {
        prompt: request,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

app.post("/api/get-example-response", async (req, res) => {
  try {
    const { prompt } = req.body;

    const userGarments = await Garment.find({});

    // create a new array of garments with the _id, name, colors, brand and type
    const garments = userGarments.map((garment) => {
      return {
        _id: garment._id,
        name: garment.name,
        colors: garment.colors,
        brand: garment.brand,
        type: garment.type,
      };
    });

    let request = {
      prompt: prompt.toString(),
      garments,
    };
    request = JSON.stringify(request);

    const responseString = await generateOutfit(request);

    res.status(200).json({
      success: true,
      data: {
        responseString,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

app.post("/api/get-example-processing", async (req, res) => {
  try {
    const responseString = "{\n  \"outfit\": [\n    {\n      \"category\": \"top\",\n      \"id\": \"64ebce755c909f6413473f92\"\n    },\n    {\n      \"category\": \"bottom\",\n      \"id\": \"64ec0ffc214c017e9400332d\"\n    }\n  ],\n  \"caption\": \"Wear the H&M white hoodie with the slim fit black twill trouser from Tommy Hilfiger for a casual yet chic look perfect for a day out in NYC\"\n}" // prettier-ignore

    console.log("request received");

    const outfit = JSON.parse(responseString).outfit;

    console.log("outfit parsed");

    console.log(outfit);

    // fetch the garments from the database
    const sendOutfit = await Promise.all(
      outfit.map(async (garment) => {
        console.log("check");
        const databaseGarment = await Garment.findById(garment.id);

        if (!databaseGarment) {
          return res.status(404).json({
            success: false,
            error: "Garment not found",
          });
        }

        const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);

        return {
          // get type from generateOutfit function
          type: garment.category,
          name: databaseGarment.name,
          brand: databaseGarment.brand,
          colors: databaseGarment.colors,
          image_url: signedUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        outfit: sendOutfit,
        // caption: JSON.parse(await generateOutfit(request)).caption,
      },
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
