const express = require("express");
const router = express.Router();

// auth imports
const passport = require("passport");

// Middleware
const isPassportAuth = require("../middleware/passportAuth");

// Models
const User = require("../models/User");
const AccessCode = require("../models/AccessCode");

require("../services/Passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: `${
      process.env.NODE_ENV === "development"
        ? process.env.DEVELOPMENT_CLIENT_URL
        : process.env.PRODUCTION_CLIENT_URL
    }/login-success`,
  })
);

router.get("/me", async (req, res) => {
  res.send(
    req.user
      ? {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          emailConfirmed: req.user.emailConfirmed,
          profilePic: req.user.profilePic,
          hasAccess: req.user.hasAccess,
        }
      : null
  );
});

router.post("/add-access-code", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(400).json({
        success: false,
        error: "You're not logged in.",
      });
    }

    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        error: "Please enter an access code.",
      });
    }

    const accessCodeExists = await AccessCode.findOne({ accessCode });

    if (!accessCodeExists) {
      return res.status(400).json({
        success: false,
        error: "Invalid Access Code",
      });
    }

    if (accessCodeExists.isUsed && accessCodeExists.isSingleUse) {
      return res.status(400).json({
        success: false,
        error: "Access Code already used",
      });
    }

    const user = await User.findById(req.user);

    user.hasAccess = true;
    user.referredBy = accessCodeExists.referrer;
    await user.save();

    accessCodeExists.isUsed = true;
    accessCodeExists.referee.push(req.user);
    await accessCodeExists.save();

    res.status(200).json({
      success: true,
      data: {
        message: "Access Code Added",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailConfirmed: user.emailConfirmed,
          profilePic: user.profilePic,
          hasAccess: user.hasAccess,
        },
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/access-code-required", async (req, res) => {
  return res.status(200).json({
    success: true,
    data: process.env.ACCESS_CODE_REQUIRED === "true",
  });
});

router.post("/logout", (req, res) => {
  try {
    req.logout();
    res.status(200).json({
      message: "Logged out",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// get access codes
router.get("/access-codes", isPassportAuth, async (req, res) => {
  try {
    const DBAccessCodes = await AccessCode.find({ referrer: req.user._id });

    const accessCodes = DBAccessCodes.map((accessCode) => {
      return {
        _id: accessCode._id,
        referrer: accessCode.referrer,
        accessCode: accessCode.accessCode,
        isUsed: accessCode.isUsed,
        createdAt: accessCode.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: accessCodes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
