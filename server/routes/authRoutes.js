const express = require("express");
const router = express.Router();

// auth imports
const passport = require("passport");

// Middleware
const isPassportAuth = require("../middleware/passportAuth");

// Models
const User = require("../models/User");
const Note = require("../models/Note");
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

router.post("/add-access-code", isPassportAuth, async (req, res) => {
  try {
    const { accessCode } = req.body;

    const accessCodeExists = await AccessCode.findOne({ accessCode });

    if (!accessCodeExists) {
      return res.status(400).json({
        success: false,
        error: "Invalid Access Code",
      });
    }

    if (accessCodeExists.isUsed) {
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
    accessCodeExists.referee = req.user;
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
    data: true,
  });
});

// create access code (test function)
// router.get("/create-access-code", async (req, res) => {
//   try {
//     const accessCode = new AccessCode({
//       accessCode: Math.random().toString(36).substring(7).toUpperCase(),
//       createdAt: new Date().toISOString(),
//     });

//     await accessCode.save();

//     res.status(200).json({
//       success: true,
//       data: {
//         message: "Access Code Created",
//         accessCode,
//       },
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });

router.post("/logout", (req, res) => {
  req.logout();
  res.status(200).json({
    message: "Logged out",
  });
});

// router.delete("/delete-account", async (req, res) => {
//   try {
//     // Delete all notes of the user
//     await Note.deleteMany({ user: req.userId });

//     // Delete the user object itself
//     await User.findByIdAndDelete(req.userId);

//     res.status(200).json({
//       success: true,
//       data: {
//         message: "Account Deleted",
//       },
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });

module.exports = router;
