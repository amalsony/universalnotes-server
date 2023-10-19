const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");

// Test
const { testData } = require("../config/testData");

// create shopping recommendations by inputting the garment in the format "Black Dress Pants by Tommy Hilfiger" to the generateShoppingSearchTerms function and requesting the Amazon API to find clothes for each of the tops, bottoms, and coats arrays in the JSON response and return the results to the requester
router.get("/recommend/:id", async (req, res) => {
  try {
    const garmentId = req.params.id;

    // fetch the garment from the database
    const databaseGarment = await Garment.findById(garmentId);

    if (!databaseGarment) {
      return res.status(404).json({
        success: false,
        error: "Garment not found",
      });
    }

    // check if the garment is a top or a bottom
    const garmentCategory = databaseGarment.category;

    if (garmentCategory === "top") {
      const recommendations = [testData[0], testData[1]];
      return res.status(200).json({
        success: true,
        data: {
          recommendations,
        },
      });
    } else if (garmentCategory === "bottom") {
      const recommendations = [testData[2]];
      return res.status(200).json({
        success: true,
        data: {
          recommendations,
        },
      });
    } else {
      // shopping is currently only supported for tops and bottoms
      return res.status(400).json({
        success: false,
        error: "Shopping is currently only supported for tops and bottoms",
      });
    }

    // const garment = `${
    //   databaseGarment.colors?.length > 0 ? databaseGarment.colors[0] + " " : ""
    // }${databaseGarment.name} by ${databaseGarment.brand}`;

    // const shoppingSearchTerms = await generateShoppingSearchTerms(garment);

    // // parse the shopping search terms
    // const shoppingSearchTermsJson = JSON.parse(shoppingSearchTerms);

    // const { tops, bottoms, coats } = shoppingSearchTermsJson;
    // const searchTerms = [...tops, ...bottoms, ...coats];

    // res.status(200).json({
    //   success: true,
    //   data: {
    //     garment,
    //     tops,
    //     bottoms,
    //     coats,
    //     searchTerms,
    //   },
    // });
  } catch (err) {
    console.log("error", err);

    res.status(400).json({
      success: false,
      error: err,
    });
  }
});

module.exports = router;
