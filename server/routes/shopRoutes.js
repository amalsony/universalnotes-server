const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");
const User = require("../models/User");

// Middleware
const auth = require("../middleware/auth");

// OpenAI helper functions
const generateShoppingSearchTerms = require("../openai/garmentRecommendation");
const predictGender = require("../openai/predictGender");

// Amazon helper functions
const searchAmazon = require("../utilities/searchAmazon");

router.get("/recommend/:id", auth, async (req, res) => {
  try {
    const garmentId = req.params.id;
    const databaseGarment = await Garment.findById(garmentId);

    if (!databaseGarment) {
      return res
        .status(404)
        .json({ success: false, error: "Garment not found" });
    }

    // check if the user owns the garment
    if (databaseGarment.user.toString() !== req.userId) {
      return res.status(401).json({
        success: false,
        error: "You're not authorized to view this garment",
      });
    }

    // Gender
    // check if the user has a predictedGender
    const user = await User.findById(req.userId);
    let predictedGender = await getUserGender();

    async function getUserGender() {
      if (
        !user.predictedGender ||
        (user.predictedGender !== "male" && user.predictedGender !== "female")
      ) {
        // fetch all the garments from the database
        const garments = await Garment.find({ user: req.userId });
        // create an array garmentNames that contains the name of each garment as a string in the format "Dress Pants by Tommy Hilfiger"
        let garmentNames = garments.map(
          (garment) => `${garment.name} by ${garment.brand}`
        );
        garmentNames = garmentNames.join(", ");

        const { gender } = JSON.parse(await predictGender(garmentNames));

        // set the predictedGender in the database
        user.predictedGender = gender;
        await user.save();

        return gender;
      } else {
        return user.predictedGender;
      }
    }

    const garmentName = `${
      databaseGarment.colors?.length > 0 ? databaseGarment.colors[0] + " " : ""
    }${databaseGarment.name} by ${databaseGarment.brand}`;
    const shoppingSearchTerms = await generateShoppingSearchTerms(
      `Garment: ${garmentName} Predicted gender: ${predictedGender}`
    );

    // parse the shopping search terms
    const shoppingSearchTermsJson = JSON.parse(shoppingSearchTerms);

    const { tops, bottoms } = shoppingSearchTermsJson;
    const searchTerms = [...tops, ...bottoms];

    // search Amazon for each of the search terms
    const amazonResults = await searchAmazon(searchTerms[0]);

    res.status(200).json({
      success: true,
      data: {
        recommendations: amazonResults,
      },
    });
  } catch (err) {
    console.log("error", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
