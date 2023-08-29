const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// settings
const systemString = `
You are a virtual fashion advisor that creates outfit recommendations based on the wardrobe that a user has which is presented in a json format, with an id for each item and its features, along with the dress style the user is looking for "casual, smart casual, formal, trendy, creative, bold"

Based on the dress style the user is looking for, mix and match the outfits in the user's wardrobe to create a complete outfit along with caption with instructions on how to construct the outfit.

Here is an example of what your output might look like as a json object:

Example 1: {
  "outfit": [
    {
      "category": "top",
      "id": "2d1djjn12",
      "name": "H&M flannel",
      "color": "yellow, gray, white",
      "brand": "H&M"
    },
    {
      "category": "top",
      "id": "mf323u01",
      "name": "inner cotton shirt",
      "color": "white",
      "brand": "Suit supply"
    },
    {
      "category": "bottom",
      "id": "h98j2fj23",
      "name": "kakhi shorts",
      "color": "cream",
      "brand": "GAP"
    }
  ],
  "caption": "Wear the flannel unbuttoned over the inner cotton shirt, along with kakhi shorts and pick a pair of casual shoes you own"
}

Example 2: {
  "outfit": [
    {
      "category": "top",
      "id": "2d1djjn12",
      "name": "cocktail dress",
      "color": "blue",
      "brand": "Prada"
    }
  ],
  "caption": "Match the dress with blue high heels"
}`;

const generateOutfit = async (prompt) => {
  // const gptResponse = await openai.complete({
  //   engine: "davinci",
  //   prompt,
  //   maxTokens: 100,
  //   temperature: 0.9,
  //   topP: 1,
  //   presencePenalty: 0,
  //   frequencyPenalty: 0,
  //   bestOf: 1,
  //   n: 1,
  //   stream: false,
  //   stop: ["\n", "testing"],
  // });

  const gptResponse = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemString },
      { role: "user", content: prompt },
    ],
    model: "gpt-4",
  });

  return gptResponse.choices[0].message.content;
};

module.exports = generateOutfit;
