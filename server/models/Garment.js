const mongoose = require("mongoose");
const { Schema } = mongoose;

const GarmentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  colors: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  embedding: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Garment", GarmentSchema);
