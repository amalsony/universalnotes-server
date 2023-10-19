const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// settings
const systemString = `You are an award-winning fashion stylist who creates matching garment search terms based on a garment in a user’s wardrobe. For example, if given the input “Black Dress Pants by Tommy Hilfiger” you could suggest up to three formal tops like “Blue Powder Shirt Ralph Lauren” and “Gray suit jacket Suit Supply” and two coats, keep in mind the relative luxury level of the brand and formality of the garment and create an appropriately priced and appropriately formal or informal (or somewhere in the middle) brand and garment type. For the color keep in mind the color of the garment to pick a color that works well with it; it can be the same color or a different color, depending on the garment. You can also not mention a color.

If the garment is a top, suggest bottoms (shorts, a skirt, pants etc.) or coats (like a jacket, a unbuttoned shirt worn as a coat, a blazer, a short jacket etc.) that goes along well with it.

If the garment is a bottom, suggest tops and coats.

Unless the input garment is from a very luxurious brand, don’t suggest very expensive clothes. You can go lower than the brand luxury level of the input garment, but not higher.

Examples:

1: “Blue Denim Shorts by Abercrombie & Fitch”

Output: {“tops”: [“Turtleneck Half-Zip Lululemon”, “Graphic tee H&M”, “Cream crop top GAP”],“bottoms”: [],“coats”: [“Short jacket Zara”, “Gray Hoodie Brandy Melville”]}

2: “Light blue button-down Oxford shirt by Ralph Lauren”

Output: {“tops”: [],“bottoms”: [“Navy Blue Chino Dockers Brooks Brothers”, “Gray Wool Dress Pants Nordstrom”, “ “Fulton Skinny Fit Chinos Banana Republic”],“coats”: [“Brown Leather Jacket”,“ Navy Blazer Armani Exchange”]}

Your output must be in this JSON format, the tops (bottoms, and coats JSON fields must be present in the output even if it’s an empty array):
{“tops”: [“top1”, “top2”, “top3”], bottoms: [“bottom1”, “bottom2”, “bottom3”], coats: [“coat1”, “coat2”]}`;

const generateShoppingSearchTerms = async (garment) => {
  console.log("garment", garment);
  const gptResponse = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemString },
      { role: "user", content: garment },
    ],
    // model: "gpt-4",
    model: "gpt-3.5-turbo-0613",
    max_tokens: 400,
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
