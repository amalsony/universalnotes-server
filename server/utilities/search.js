// Models
const Garment = require("../models/Garment");
const Mongoose = require("mongoose");

// Embeddings
const createEmbedding = require("../openai/embed");

const findMatchingGarments = async (prompt, category, userId) => {
  // validation
  if (!userId) {
    console.log("no user");
    return [];
  } else if (typeof userId !== "string") {
    console.log("user is not a string");
    return [];
  } else if (!prompt) {
    console.log("no prompt");
    return [];
  } else if (typeof prompt !== "string") {
    console.log("prompt is not a string");
    return [];
  } else if (category && typeof category !== "string") {
    console.log("category is not a string");
    return [];
  } else if (
    category !== "top" &&
    category !== "bottom" &&
    category !== "coat" &&
    category !== "full"
  ) {
    console.log("category is not top, bottom, coat full");
    return [];
  }

  // create an objectId from the user string
  const user = new Mongoose.Types.ObjectId(userId);

  // create embedding for prompt
  const embedding = await createEmbedding(prompt);

  const collection = Garment.collection;

  let matchingGarments;

  if (category) {
    matchingGarments = await collection
      .aggregate([
        {
          $search: {
            index: "default",
            knnBeta: {
              vector: embedding,
              path: "embedding",
              k: 10,
              filter: {
                compound: {
                  must: [
                    {
                      equals: {
                        value: user,
                        path: "user",
                      },
                    },
                    {
                      text: {
                        query: category,
                        path: "category",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $limit: 2,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            brand: 1,
            colors: 1,
          },
        },
      ])
      .toArray();
  } else {
    matchingGarments = await collection
      .aggregate([
        {
          $search: {
            index: "default",
            knnBeta: {
              vector: embedding,
              path: "embedding",
              k: 5,
            },
          },
        },
      ])
      .toArray();
  }

  return matchingGarments;
};

module.exports = findMatchingGarments;
