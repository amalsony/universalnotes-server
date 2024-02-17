const mongoose = require("mongoose");
const { Schema } = mongoose;

const AccessCodeSchema = new Schema({
  referrer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false,
  },
  referee: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  isSingleUse: {
    type: Boolean,
    default: true,
  },
  accessCode: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("AccessCode", AccessCodeSchema);
