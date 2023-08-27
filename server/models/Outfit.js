const mongoose = require("mongoose");
const { Schema } = mongoose;

const OutfitSchema = new Schema({
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
  submitted_prompt: {
    type: String,
    required: true,
  },
  garments: {
    type: Schema.Types.ObjectId,
    ref: "Garment",
    required: true,
  },
  caption: {
    type: String,
  },
});

module.exports = mongoose.model("Outfit", OutfitSchema);
