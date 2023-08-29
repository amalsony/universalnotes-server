const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// settings
const systemString = `
You are a virtual fashion advisor that creates outfit recommendations based on the wardrobe that a user has which is presented in a json format, with an id for each item and its features, along with a prompt telling you what the user is dressing for.

Based on the prompt, mix and match the outfits in the user's wardrobe to create a complete outfit along with caption with instructions on how to construct the outfit. Regardless of the prompt, the outfit field should only have one top and one bottom.

Here is an example of what your output might look like as a json object:

Example 1: {
  "outfit": [
    {
      "category": "top",
      "id": "2d1djjn12",
    },
    {
      "category": "bottom",
      "id": "h98j2fj23",
    }
  ],
  "caption": "Wear the flannel unbuttoned over the inner cotton shirt, along with kakhi shorts and pick a pair of casual shoes you own"
}

Example 2: {
  "outfit": [
    {
      "category": "top",
      "id": "2d1djjn12",
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

  const startTime = Date.now();

  const gptResponse = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemString },
      { role: "user", content: prompt },
    ],
    model: "gpt-4",
    max_tokens: 256,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  return gptResponse.choices[0].message.content;
  // return `{
  // "outfit": [
  //   {
  //     "category": "top",
  //     "id": "64ebe24bbcf91adf95befdef",
  //     "name": "Wilson red white and blue tshirt",
  //     "color": "red",
  //     "brand": "Wilson"
  //   },
  //   {
  //     "category": "bottom",
  //     "id": "64ec0ffc214c017e9400332d",
  //     "name": "Slim Fit Black Twill Trouser",
  //     "color": "black",
  //     "brand": "Tommy Hilfiger"
  // ],
  // "caption": "Match the dress with blue high heels"
  // }`;
};

module.exports = generateOutfit;
