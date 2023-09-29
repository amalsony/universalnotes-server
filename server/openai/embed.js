const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const createEmbedding = async (text) => {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  const embedding = embeddingResponse.data[0].embedding;

  return embedding;
};

module.exports = createEmbedding;
