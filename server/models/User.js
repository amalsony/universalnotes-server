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
  birthday: {
    type: String,
  },
  gender: {
    type: String,
  },
  predictedGender: {
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
});

module.exports = mongoose.model("User", UserSchema);
