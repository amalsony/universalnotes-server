const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  url: {
    domain: {
      type: String,
      required: true,
    },
    path: {
      type: String,
    },
    full_url: {
      type: String,
      required: true,
    },
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  like_count: {
    type: Number,
    default: 0,
  },
  dislikes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  dislike_count: {
    type: Number,
    default: 0,
  },
  body: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    index: true,
  },
  isDemoNote: {
    type: Boolean,
    default: false,
  },
  isAgainstContext: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Note", NoteSchema);
