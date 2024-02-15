const express = require("express");
const router = express.Router();

// auth imports
const passport = require("passport");

// Models
const User = require("../models/User");
const Note = require("../models/Note");

require("../services/Passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/login-success",
  })
);

router.get("/me", async (req, res) => {
  res.send(req.user);
});

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
