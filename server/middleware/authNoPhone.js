const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

// Models
const User = require("../models/User");

const authNoPhone = async (req, res, next) => {
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

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Your session has expired. Please log out and log in again.",
    });
  }
};

module.exports = authNoPhone;
