const mongoose = require("mongoose");
const { Schema } = mongoose;

// const OutfitSchema = new Schema({
//   user: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   shortTitle: {
//     type: String,
//     required: true,
//   },
//   prompt: {
//     type: String,
//     required: true,
//   },
//   tops: {
//     type: [{ type: Schema.Types.ObjectId, ref: "Garment" }],
//     default: [],
//   },
//   bottoms: {
//     type: [{ type: Schema.Types.ObjectId, ref: "Garment" }],
//     default: [],
//   },
//   fulls: {
//     type: [{ type: Schema.Types.ObjectId, ref: "Garment" }],
//     default: [],
//   },
//   caption: {
//     type: String,
//   },
//   createdAt: {
//     type: String,
//     required: true,
//     index: true,
//   },
// });

const OutfitSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shortTitle: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  outfit: {
    tops: [
      {
        type: Schema.Types.ObjectId,
        ref: "Garment",
      },
    ],
    bottoms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Garment",
      },
    ],
    fulls: [
      {
        type: Schema.Types.ObjectId,
        ref: "Garment",
      },
    ],
  },
  caption: {
    type: String,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Outfit", OutfitSchema);
