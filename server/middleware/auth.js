const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

// Models
const User = require("../models/User");

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "You're not logged in.",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;

    // check if the user's phone number is verified
    const databaseUser = await User.findById(req.userId);

    if (!databaseUser?.phoneConfirmed) {
      return res.status(401).json({
        success: false,
        error: "Please verify your phone number",
      });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "Invalid token",
    });
  }
};

module.exports = auth;
