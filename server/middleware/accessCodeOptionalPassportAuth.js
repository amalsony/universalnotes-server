// Models
const User = require("../models/User");

// accessCodeOptionalPassportAuth middleware
const isAccessCodeOptionalPassportAuth = async (req, res, next) => {
  const accessCodeRequired = process.env.ACCESS_CODE_REQUIRED === "true";

  if (accessCodeRequired) {
    if (req.isAuthenticated()) {
      if (req.user.hasAccess) {
        return next();
      } else {
        console.log("req.user._id", req.user._id);
        // Redundancy in case cookie hasn't been updated since access code was added
        const user = await User.findById(req.user._id);
        if (user.hasAccess) {
          return next();
        } else {
          return res.status(400).json({
            success: false,
            error:
              "Please enter an access code in the extension to access this resource.",
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error:
          "Please log in and enter an access code in the extension to continue.",
      });
    }
  } else {
    return next();
  }
};

module.exports = isAccessCodeOptionalPassportAuth;
