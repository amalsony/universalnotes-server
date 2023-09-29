const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReferralSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  referralCode: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  requiresPoints: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
  peopleReferred: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
});

module.exports = mongoose.model("Referral", ReferralSchema);
