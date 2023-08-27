const mongoose = require("mongoose");
const { Schema } = mongoose;

const GarmentSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
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
  image_url: {
    type: String,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Garment", GarmentSchema);
