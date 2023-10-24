// Models
const Garment = require("../models/Garment");
const Mongoose = require("mongoose");
const getSeason = require("./getSeason");

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

  // the prompt is something like "I want to wear a top that is blue and has a collar". Add a question and the current season to the end like this "I want to wear a top that is blue and has a collar What should I wear? The current season is [season]."
  const season = getSeason();
  let searchPrompt;
  if (typeof season === "string") {
    searchPrompt = `${prompt} What should I wear? The current season is ${season}.`;
  } else {
    searchPrompt = `${prompt} What should I wear?`;
  }

  // create embedding for prompt
  const embedding = await createEmbedding(searchPrompt);

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
          $limit: 4,
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
