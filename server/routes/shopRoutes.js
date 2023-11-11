const express = require("express");
const router = express.Router();

// Models
const Garment = require("../models/Garment");

// OpenAI helper functions
const generateShoppingSearchTerms = require("../openai/garmentRecommendation");

// Amazon helper functions
const searchAmazon = require("../utilities/searchAmazon");

router.get("/recommend/:id", async (req, res) => {
  try {
    const garmentId = req.params.id;
    const databaseGarment = await Garment.findById(garmentId);

    if (!databaseGarment) {
      return res
        .status(404)
        .json({ success: false, error: "Garment not found" });
    }

    const garmentName = `${databaseGarment.brand} ${databaseGarment.name}`;
    const shoppingSearchTerms = await generateShoppingSearchTerms(garmentName);

    // parse the shopping search terms
    console.log(shoppingSearchTerms);
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

// // create shopping recommendations by inputting the garment in the format "Black Dress Pants by Tommy Hilfiger" to the generateShoppingSearchTerms function and requesting the Amazon API to find clothes for each of the tops, bottoms, and coats arrays in the JSON response and return the results to the requester
// router.get("/recommend/:id", async (req, res) => {
//   try {
//     const garmentId = req.params.id;

//     // fetch the garment from the database
//     const databaseGarment = await Garment.findById(garmentId);

//     if (!databaseGarment) {
//       return res.status(404).json({
//         success: false,
//         error: "Garment not found",
//       });
//     }

//     // check if the garment is a top or a bottom
//     const garmentCategory = databaseGarment.category;

//     if (garmentCategory === "top") {
//       // const recommendations = [testData[0], testData[1]];
//       // return res.status(200).json({
//       //   success: true,
//       //   data: {
//       //     recommendations,
//       //   },
//       // });
//       // shopping is coming soon
//       return res.status(400).json({
//         success: false,
//         error: "The shopping experience is coming out this Saturday!",
//       });
//     } else if (garmentCategory === "bottom") {
//       // const recommendations = [testData[0], testData[1]];
//       // return res.status(200).json({
//       //   success: true,
//       //   data: {
//       //     recommendations,
//       //   },
//       // });
//       // shopping is coming soon
//       return res.status(400).json({
//         success: false,
//         error: "The shopping experience is coming out this Saturday!",
//       });
//     } else {
//       // shopping is currently only supported for tops and bottoms
//       return res.status(400).json({
//         success: false,
//         error: "The shopping experience is coming out this Saturday!",
//       });
//     }

//     // const garment = `${
//     //   databaseGarment.colors?.length > 0 ? databaseGarment.colors[0] + " " : ""
//     // }${databaseGarment.name} by ${databaseGarment.brand}`;

//     // const shoppingSearchTerms = await generateShoppingSearchTerms(garment);

//     // // parse the shopping search terms
//     // const shoppingSearchTermsJson = JSON.parse(shoppingSearchTerms);

//     // const { tops, bottoms, coats } = shoppingSearchTermsJson;
//     // const searchTerms = [...tops, ...bottoms, ...coats];

//     // res.status(200).json({
//     //   success: true,
//     //   data: {
//     //     garment,
//     //     tops,
//     //     bottoms,
//     //     coats,
//     //     searchTerms,
//     //   },
//     // });
//   } catch (err) {
//     console.log("error", err);

//     res.status(400).json({
//       success: false,
//       error: err,
//     });
//   }
// });

// module.exports = router;
