const mongoose = require("mongoose");
const { Schema } = mongoose;

const DislikeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note",
    required: true,
    index: true,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Dislike", DislikeSchema);
