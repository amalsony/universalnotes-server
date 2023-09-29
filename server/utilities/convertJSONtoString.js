const createEmbeddingText = require("./createEmbeddingText");

// Desc: Converts JSON to string without category
// const convertJSONtoCustomString = (json) => {
//   try {
//     const prompt = `prompt: ${json.prompt}`;
//     const garments = json.garments.map((garment) => {
//       const garmentTuple = `(${garment._id}, ${
//         garment.name
//       }, [${garment.colors.join(", ")}], ${garment.brand})`;
//       return garmentTuple;
//     });
//     const result = `${prompt}, garments: ${garments.join(", ")}`;
//     return result;
//   } catch (error) {
//     console.error("Error parsing JSON:", error);
//     return null;
//   }
// };

// Desc: Converts JSON to string with category
const convertJSONtoCustomString = (json) => {
  try {
    // Initialize the output string
    let output = `prompt: ${json.prompt}, garments: `;

    if (json.garments.tops.length !== 0) {
      output += "tops: ";
      // Iterate through the "tops" array
      json.garments.tops.forEach((top) => {
        output += `(${top._id}, ${createEmbeddingText(
          top.name,
          top.brand,
          top.colors
        )}), `;
      });
    }

    if (json.garments.bottoms.length !== 0) {
      output += "bottoms: ";

      // Iterate through the "bottoms" array
      json.garments.bottoms.forEach((bottom) => {
        output += `(${bottom._id}, ${createEmbeddingText(
          bottom.name,
          bottom.brand,
          bottom.colors
        )}), `;
      });
    }

    if (json.garments.coats.length !== 0) {
      output += "coats: ";

      // Iterate through the "coats" array
      json.garments.coats.forEach((coat) => {
        output += `(${coat._id}, ${createEmbeddingText(
          coat.name,
          coat.brand,
          coat.colors
        )}), `;
      });
    }

    if (json.garments.fulls.length !== 0) {
      output += "fulls: ";

      // Iterate through the "fulls" array
      json.garments.fulls.forEach((full) => {
        output += `(${full._id}, ${createEmbeddingText(
          full.name,
          full.brand,
          full.colors
        )}), `;
      });
    }

    // Remove the trailing comma and space
    output = output.slice(0, -2);

    return output;
  } catch (error) {
    return "Error parsing JSON";
  }
};

module.exports = convertJSONtoCustomString;
