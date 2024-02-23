// Models
const User = require("../models/User");

// isPassportAuth middleware
const isPassportAuth = async (req, res, next) => {
  if (!process.env.ACCESS_CODE_REQUIRED && req.isAuthenticated()) {
    return next(); // Proceed to the next middleware/route handler
  } else if (req.isAuthenticated()) {
    const user = await User.findById(req.user._id);
    if (user.hasAccess) {
      return next();
    } else {
      res.status(400).json({
        success: false,
        error: "Please enter an access code in the extension to continue.",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      error: "You're not logged in.",
    });
  }
};

module.exports = isPassportAuth;
