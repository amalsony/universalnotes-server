const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");
const Outfit = require("../models/Outfit");
const Referral = require("../models/Referral");

// Middleware
const auth = require("../middleware/auth");

// utilities
const convertJSONtoCustomString = require("../utilities/convertJSONtoString");
const findMatchingGarments = require("../utilities/search");

// Image upload imports
const { getObjectSignedUrl } = require("../aws/s3");

// AI imports
const generateOutfit = require("../openai/generate");

// get user outfits
router.get("/", auth, async (req, res) => {
  try {
    const outfits = await Outfit.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    // fetch the garments from the database
    async function getSendGarmentArray(array) {
      // check if the array is valid
      if (!array || typeof array === undefined || array.length === 0) {
        return [];
      }

      return await Promise.all(
        array.map(async (garment) => {
          const databaseGarment = await Garment.findById(garment);

          if (!databaseGarment) {
            return {};
          }

          const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);

          return {
            // get type from generateOutfit function
            _id: databaseGarment._id,
            category: databaseGarment.category,
            name: databaseGarment.name,
            brand: databaseGarment.brand,
            colors: databaseGarment.colors,
            image_url: signedUrl,
          };
        })
      );
    }

    const sendOutfits = await Promise.all(
      outfits.map(async (outfit) => {
        const sendTops = await getSendGarmentArray(outfit.outfit.tops);
        const sendBottoms = await getSendGarmentArray(outfit.outfit.bottoms);
        const sendFulls = await getSendGarmentArray(outfit.outfit.fulls);

        return {
          ...outfit._doc,
          outfit: {
            tops: sendTops,
            bottoms: sendBottoms,
            fulls: sendFulls,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sendOutfits,
    });
  } catch (err) {
    console.log("error", err);
    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

// get a single outfit
router.get("/:id", auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({
        success: false,
        error: "Outfit not found",
      });
    }

    // check if the user owns the outfit
    if (outfit.user.toString() !== req.userId) {
      return res.status(401).json({
        success: false,
        error: "You're not authorized to view this outfit",
      });
    }

    const tops = await Promise.all(
      outfit.outfit.tops?.map(async (top) => {
        const databaseGarment = await Garment.findById(top);
        const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);
        return {
          ...databaseGarment._doc,
          image_url: signedUrl,
        };
      })
    );

    const bottoms = await Promise.all(
      outfit.outfit.bottoms?.map(async (bottom) => {
        const databaseGarment = await Garment.findById(bottom);
        const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);
        return {
          ...databaseGarment._doc,
          image_url: signedUrl,
        };
      })
    );

    const fulls = await Promise.all(
      outfit.outfit.fulls?.map(async (full) => {
        const databaseGarment = await Garment.findById(full);
        const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);
        return {
          ...databaseGarment._doc,
          image_url: signedUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ...outfit._doc,
        outfit: {
          tops,
          bottoms,
          fulls,
        },
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

// delete an outfit
router.delete("/:id", auth, async (req, res) => {
  try {
    const outfit = await Outfit.findById(req.params.id);

    if (!outfit) {
      return res.status(404).json({
        success: false,
        error: "Outfit not found",
      });
    }

    // check if the user owns the outfit
    if (outfit.user.toString() !== req.userId) {
      return res.status(401).json({
        success: false,
        error: "You're not authorized to delete this outfit",
      });
    }

    // delete the outfit from the database
    await Outfit.findByIdAndDelete(req.params.id);

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

// generate outfit
router.post("/generate", auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    // if the prompt is empty, return an error
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Prompt cannot be empty",
      });
    }

    const user = req.userId;

    const referral = await Referral.findOne({ user });

    if (referral && referral.requiresPoints && referral.points <= 0) {
      return res.status(400).json({
        success: false,
        error: "You don't have enough points to create this outfit",
      });
    }

    const topGarments = await findMatchingGarments(prompt, "top", user);

    const bottomGarments = await findMatchingGarments(prompt, "bottom", user);

    const coatGarments = await findMatchingGarments(prompt, "coat", user);

    const fullGarments = await findMatchingGarments(prompt, "full", user);

    // check if there is at least one top and one bottom or one full
    if (
      (topGarments.length === 0 || bottomGarments.length === 0) &&
      fullGarments.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Add at least one top and one bottom to continue",
      });
    }

    let request = {
      prompt: prompt.toString(),
      garments: {
        tops: topGarments,
        bottoms: bottomGarments,
        coats: coatGarments,
        fulls: fullGarments,
      },
    };

    request = convertJSONtoCustomString(request);

    const data = JSON.parse(await generateOutfit(request));
    const caption = data.caption;

    // fetch the garments from the database
    async function getSendGarmentArray(array) {
      // check if the array is valid
      if (!array || typeof array === undefined || array.length === 0) {
        return [];
      }

      return await Promise.all(
        array.map(async (garment) => {
          const databaseGarment = await Garment.findById(garment.id);

          if (!databaseGarment) {
            return {};
          }

          const signedUrl = await getObjectSignedUrl(databaseGarment.image_url);

          return {
            // get type from generateOutfit function
            _id: databaseGarment._id,
            category: databaseGarment.category,
            name: databaseGarment.name,
            brand: databaseGarment.brand,
            colors: databaseGarment.colors,
            image_url: signedUrl,
          };
        })
      );
    }

    const sendTops = await getSendGarmentArray(data.outfit.tops);
    const sendBottoms = await getSendGarmentArray(data.outfit.bottoms);
    const sendFulls = await getSendGarmentArray(data.outfit.fulls);

    // save the outfit in the database
    const outfit = new Outfit({
      user,
      shortTitle:
        sendTops.length !== 0 && sendBottoms.length !== 0
          ? `${sendTops[0].name} + ${sendBottoms[0].name}`
          : sendFulls.length !== 0
          ? sendFulls[0].name
          : "Untitled",
      prompt,
      outfit: {
        tops: sendTops.map((top) => top._id),
        bottoms: sendBottoms.map((bottom) => bottom._id),
        fulls: sendFulls.map((full) => full._id),
      },
      caption,
      createdAt: new Date().toISOString(),
    });

    await outfit.save();

    console.log("referral", referral);
    if (referral && referral.requiresPoints) {
      console.log("entered if statement");
      referral.points -= 1;
      await referral.save();
    }

    res.status(200).json({
      success: true,
      data: {
        _id: outfit._id,
        shortTitle: outfit.shortTitle,
        prompt,
        outfit: {
          tops: sendTops,
          bottoms: sendBottoms,
          fulls: sendFulls,
        },
        caption,
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

module.exports = router;
