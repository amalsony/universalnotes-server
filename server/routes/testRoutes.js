const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");

// AI Imports
const generateOutfit = require("../openai/generate");
const createEmbedding = require("../openai/embed");
const findMatchingGarments = require("../utilities/search");

// utilities
const {
  convertJSONtoCustomString,
} = require("../utilities/convertJSONtoString");
const createEmbeddingText = require("../utilities/createEmbeddingText");

// Image upload imports
const { uploadFile, deleteFile, getObjectSignedUrl } = require("../aws/s3");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");

// file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// create default profile pics, and upload to s3, compress pngs to jpgs with quality 80. 26 images are sent in the request each with the name format "A.png", "B.png" etc. Resize to 96 x 96 and 196 x 196 and save them in a new folder in the s3 bucket called profile-pics with the names "A_96.jpeg", "A_196.jpeg", "B_96.jpeg", etc.
router.post(
  "/create-default-profile-pics",
  upload.array("profile-pics", 26),
  async (req, res) => {
    try {
      const files = req.files;
      const filePromises = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const fileName = file.originalname;
        const fileExtension = fileName.split(".").pop();

        const newFileName = fileName.replace(/(.png)$/, ".jpeg");

        const fileBuffer = await sharp(file.buffer)
          .resize(96, 96)
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();

        const fileBuffer2 = await sharp(file.buffer)
          .resize(196, 196)
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();

        const fileBuffer3 = await sharp(file.buffer)
          .resize(400, 400)
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();

        const uploadPromise = uploadFile(
          fileBuffer,
          `profile-pics/${newFileName.replace(/(.jpeg)$/, "_96.jpeg")}`,
          "image/jpeg"
        );
        const uploadPromise2 = uploadFile(
          fileBuffer2,
          `profile-pics/${newFileName.replace(/(.jpeg)$/, "_196.jpeg")}`,
          "image/jpeg"
        );

        const uploadPromise3 = uploadFile(
          fileBuffer3,
          `profile-pics/${newFileName.replace(/(.jpeg)$/, "_400.jpeg")}`,
          "image/jpeg"
        );

        filePromises.push(uploadPromise);
        filePromises.push(uploadPromise2);
        filePromises.push(uploadPromise3);
      }

      await Promise.all(filePromises);

      res.status(200).send("Profile pics created successfully");
    } catch (error) {
      console.error("Error creating default profile pics:", error);
      res.status(500).send("Something went wrong");
    }
  }
);

router.get("/assign-users-to-garments", async (req, res) => {
  const user1Id = "650289d73116317d2314b38a";
  const user2Id = "65036298d9a20b26f67678a5";

  // fetch all garments
  const garments = await Garment.find({});

  // to create the data, asign user1 to the half the garments and half to user2
  const data = garments.map((garment, index) => {
    if (index % 2 === 0) {
      return {
        ...garment._doc,
        user: user1Id,
      };
    } else {
      return {
        ...garment._doc,
        user: user2Id,
      };
    }
  });

  data.map(async (garment) => {
    const updatedGarment = await Garment.findByIdAndUpdate(
      garment._id,
      garment,
      {
        new: true,
      }
    );

    console.log(updatedGarment);
  });

  res.status(200).json({
    success: true,
    data: data,
  });
});

// create embeddings for all garments
router.get("/create-embeddings", async (req, res) => {
  try {
    // fetch all garments
    const garments = await Garment.find({});

    // create a new array of garments with the _id, name, colors, brand and type
    const garmentsWithEmbeddings = await Promise.all(
      garments.map(async (garment) => {
        const embeddingText = createEmbeddingText(
          garment.name,
          garment.brand,
          garment.colors
        );

        console.log("embeddingText", embeddingText);

        const embedding = await createEmbedding(embeddingText);

        return {
          ...garment._doc,
          embedding,
        };
      })
    );

    // update the garments in the database
    garmentsWithEmbeddings.map(async (garment) => {
      const updatedGarment = await Garment.findByIdAndUpdate(
        garment._id,
        garment,
        {
          new: true,
        }
      );

      console.log(updatedGarment);
    });

    res.status(200).json({
      success: true,
      data: garmentsWithEmbeddings,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

router.put("/add-categories", async (req, res) => {
  try {
    // garments with top, bottom, coat, and full-body categories
    // const garmentsWithCategories = [
    //   { _id: "64ebce755c909f6413473f92", category: "top" },
    //   { _id: "64ebcee95c909f6413473f94", category: "full-body" },
    //   { _id: "64ec08ce214c017e9400330a", category: "top" },
    //   { _id: "64ec0ffc214c017e9400332d", category: "bottom" },
    //   { _id: "64ed5928bfd1e5de0d1cdd03", category: "bottom" },
    //   { _id: "64ee587bc345c02c911e3dbe", category: "bottom" },
    //   { _id: "64ee98ef01d2e533dc8e9965", category: "coat" },
    //   { _id: "64ee9c2e54ef62ee5b5f099c", category: "top" },
    //   { _id: "64f3a5b5f29e8dd66743d38b", category: "top" },
    //   { _id: "6507bde7ca52f3d33c415466", category: "top" },
    //   { _id: "65089b04f045a5660ed6228d", category: "bottom" },
    //   { _id: "650a3a105f23dc5c5c75db81", category: "top" },
    // ];

    // garments with only top and bottom categories
    const garmentsWithCategories = [
      { _id: "64ebce755c909f6413473f92", category: "top" },
      { _id: "64ebcee95c909f6413473f94", category: "top" },
      { _id: "64ec08ce214c017e9400330a", category: "top" },
      { _id: "64ec0ffc214c017e9400332d", category: "bottom" },
      { _id: "64ed5928bfd1e5de0d1cdd03", category: "bottom" },
      { _id: "64ee587bc345c02c911e3dbe", category: "bottom" },
      { _id: "64ee98ef01d2e533dc8e9965", category: "top" },
      { _id: "64ee9c2e54ef62ee5b5f099c", category: "top" },
      { _id: "64f3a5b5f29e8dd66743d38b", category: "top" },
      { _id: "6507bde7ca52f3d33c415466", category: "top" },
      { _id: "65089b04f045a5660ed6228d", category: "bottom" },
      { _id: "650a3a105f23dc5c5c75db81", category: "top" },
    ];

    for (const garment of garmentsWithCategories) {
      await Garment.updateOne(
        { _id: garment._id },
        { category: garment.category }
      );
    }

    res.status(200).json({
      success: true,
      data: "Categories added successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

// query embeddings (cosine similarity)
router.get("/query-embeddings", async (req, res) => {
  try {
    const query =
      "What should I wear to the mall? I want to look casual but still put together.";

    // check if query is a string
    if (typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query must be a string",
      });
    }

    // create embedding for query
    const queryEmbedding = await createEmbedding(query);

    const collection = Garment.collection;

    const matchingGarments = await collection
      .aggregate([
        {
          $search: {
            index: "default",
            knnBeta: {
              vector: queryEmbedding,
              path: "embedding",
              k: 5,
            },
          },
        },
        {
          $match: {
            colors: {
              $in: ["White", "Red"],
            },
          },
        },
      ])
      .toArray();

    // garments without the embedding field
    const sendGarments = matchingGarments.map((garment) => {
      const { embedding, ...garmentWithoutEmbedding } = garment;
      return garmentWithoutEmbedding;
    });

    res.status(200).json({
      success: true,
      data: sendGarments,
    });
  } catch (err) {
    console.log("query embedding test error", err);

    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

router.get("/get-example-prompt", async (req, res) => {
  try {
    // const { prompt } = req.body;

    const prompt = "What should I wear to Onam celebrations?";
    const user = "650289d73116317d2314b38a";

    const topGarments = await findMatchingGarments(prompt, "top", user);

    const bottomGarments = await findMatchingGarments(prompt, "bottom", user);

    let request = {
      prompt: prompt.toString(),
      garments: {
        tops: topGarments,
        bottoms: bottomGarments,
      },
    };
    // request = JSON.stringify(request);

    request = convertJSONtoCustomString(request);

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

router.post("/get-example-response", async (req, res) => {
  try {
    // const { prompt } = req.body;

    const prompt = "What should I wear to a 90s themed party?";

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
    // request = JSON.stringify(request);
    request = convertJSONtoCustomString(request);

    const responseString = await generateOutfit(request);

    res.status(200).json({
      success: true,
      data: {
        responseString,
      },
    });
  } catch (err) {
    console.log("error", err);

    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

router.post("/api/get-example-processing", async (req, res) => {
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

module.exports = router;
