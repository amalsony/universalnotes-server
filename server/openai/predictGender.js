const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// settings
const systemString = `You are part of a fashion app that helps users find clothes that match their existing clothes. 

You need to predict the gender of a user based on the garments in their in-app wardrobe. For the purposes of this app, you must give your best estimate of "male" or "female"

Your output must be in this exact JSON format:
{"gender": "male"} or {"gender": "female"}
`;

const generateShoppingSearchTerms = async (garment) => {
  console.log("garment", garment);
  const gptResponse = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemString },
      { role: "user", content: garment },
    ],
    // model: "gpt-4",
    // model: "gpt-3.5-turbo-0613",
    model: "gpt-4-1106-preview",
    max_tokens: 40,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  console.log(
    "estimated cost gpt-3.5",
    (gptResponse.usage.prompt_tokens / 1000) * 0.0015 +
      (gptResponse.usage.completion_tokens / 1000) * 0.002
  );

  return gptResponse.choices[0].message.content;
};

module.exports = generateShoppingSearchTerms;
