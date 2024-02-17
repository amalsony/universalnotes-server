const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    index: true,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    index: true,
    required: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  pendingPhoneNumber: {
    type: String,
    unique: false,
    sparse: true,
    index: true,
  },
  phoneConfirmed: {
    type: Boolean,
    default: false,
  },
  country: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  createdAt: {
    type: String,
    required: true,
    index: true,
  },
  dateOfBirth: {
    type: String,
  },
  password: {
    type: String,
  },
  googleID: {
    type: String,
  },
  usesGoogleAuth: {
    type: Boolean,
    default: false,
  },
  appleID: {
    type: String,
  },
  usesAppleAuth: {
    type: Boolean,
    default: false,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  hidden_notes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
  ],
  hasAccess: {
    type: Boolean,
    default: false,
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

module.exports = mongoose.model("User", UserSchema);
