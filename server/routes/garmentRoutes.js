const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");
const Outfit = require("../models/Outfit");

// Middleware
const auth = require("../middleware/auth");

// utilities
const createEmbeddingText = require("../utilities/createEmbeddingText");

// Image upload imports
const { uploadFile, deleteFile, getObjectSignedUrl } = require("../aws/s3");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");

// file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// validators
const { validateGarmentInput } = require("../utilities/validators");

// AI imports
const createEmbedding = require("../openai/embed");

// Add garment
router.post("/add", upload.single("garment-image"), auth, async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send({
      errors: {
        message: "Please add a garment image",
      },
    });
  }

  const { name, brand, colors: bodyColors, category } = req.body;

  const { valid, errors } = validateGarmentInput(
    name,
    brand,
    bodyColors,
    category
  );

  if (!valid) {
    console.log("errors", errors);
    return res.status(400).send({
      errors,
    });
  }

  let colors;
  if (typeof bodyColors === "string") {
    colors = bodyColors.split(",");
    console.log("colors string", colors);
  } else {
    colors = bodyColors;
    console.log("colors array", colors);
  }

  // embedding
  const embeddingText = createEmbeddingText(name, brand, colors);
  const embedding = await createEmbedding(embeddingText);

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
      colors,
      createdAt: new Date().toISOString(),
      image_url: imageName,
      user: req.userId,
      embedding,
      category,
    });

    // Save the garment to the database
    await garment.save();

    res.status(201).json({
      success: true,
      data: {
        _id: garment._id,
        name: garment.name,
        brand: garment.brand,
        colors: garment.colors,
        image_url: await getObjectSignedUrl(garment.image_url),
        embedding: null,
      },
    });
  } catch (err) {
    console.log("entered catch block");
    console.log("error", err);

    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const databaseGarments = await Garment.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    // for each garment, get the signed url
    const garments = await Promise.all(
      databaseGarments.map(async (garment) => {
        const signedUrl = await getObjectSignedUrl(garment.image_url);
        return {
          ...garment._doc,
          embedding: null,
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
router.get("/:id", auth, async (req, res) => {
  try {
    const garment = await Garment.findById(req.params.id);

    if (!garment) {
      return res.status(404).json({
        success: false,
        error: "Garment not found",
      });
    }

    // check if the user owns the garment
    if (garment.user.toString() !== req.userId) {
      return res.status(401).json({
        success: false,
        error: "You're not authorized to view this garment",
      });
    }

    const signedUrl = await getObjectSignedUrl(garment.image_url);

    res.status(200).json({
      success: true,
      data: {
        _id: garment._id,
        name: garment.name,
        brand: garment.brand,
        colors: garment.colors,
        category: garment.category,
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

// delete a garment
router.delete("/:id", auth, async (req, res) => {
  try {
    const garment = await Garment.findById(req.params.id);

    if (!garment) {
      return res.status(404).json({
        success: false,
        error: "Garment not found",
      });
    }

    // check if the user owns the garment
    if (garment.user.toString() !== req.userId) {
      return res.status(401).json({
        success: false,
        error: "You're not authorized to delete this garment",
      });
    }

    // delete the image from s3
    await deleteFile(garment.image_url);

    // delete the garment from the database
    await Garment.findByIdAndDelete(req.params.id);

    // delete the garment from all outfits and replace with deleted garment
    await Outfit.updateMany(
      {},
      {
        $set: {
          "outfit.tops.$[element]": "650fa8129384cd19ab07c114",
          "outfit.bottoms.$[element]": "650fa8129384cd19ab07c114",
          "outfit.fulls.$[element]": "650fa8129384cd19ab07c114",
        },
      },
      {
        arrayFilters: [{ element: req.params.id }],
      }
    );

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.log("error", err);

    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

module.exports = router;
