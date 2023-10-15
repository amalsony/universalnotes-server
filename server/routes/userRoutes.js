const express = require("express");
const router = express.Router();

// Models
const User = require("../models/User");
const Referral = require("../models/Referral");

// middleware
const auth = require("../middleware/auth");

router.get("/points", auth, async (req, res) => {
  try {
    const referral = await Referral.findOne({ user: req.userId });

    const points = referral.points;
    const referralCode = referral.referralCode;

    let show = false;
    if (referral?.peopleReferred?.length !== 0) {
      show = true;
    }
    if (referral.referredBy) {
      show = true;
    }
    if (referral.requiresPoints === false) {
      show = false;
    }
    if (referral.points <= 4) {
      show = true;
    }

    let showReferralBox;

    if (referral.requiresPoints === true && referral.points <= 4) {
      showReferralBox = true;
    }

    res.status(200).json({
      success: true,
      data: {
        points,
        show,
        showReferralBox,
        showCodeBox: referral.referredBy ? false : true,
        referralCode,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
});

router.post("/refer", auth, async (req, res) => {
  console.log("request received");
  const { referralCode } = req.body;

  const referrer = await Referral.findOne({
    referralCode: referralCode.toUpperCase().trim(),
  });
  const referee = await Referral.findOne({ user: req.userId });

  if (referee.referredBy) {
    return res.status(400).json({
      success: false,
      error: "You've already used a referral code",
    });
  }

  // see if referrer exists
  if (!referrer) {
    console.log("Entered !referrer");
    return res.status(400).json({
      success: false,
      error: "Invalid code",
    });
  }

  if (referrer.user.toString() === req.userId) {
    return res.status(400).json({
      success: false,
      error:
        "You can't refer yourself, but when one of your friends uses your code you both get points!",
    });
  }

  try {
    console.log("Entered try block");
    // Adding Points to the referrer
    let pointsToAdd = 0;
    const multiplier = 7;
    const numberOfPeoplePreviouslyReferred = referrer.peopleReferred.length;
    if (numberOfPeoplePreviouslyReferred >= 3) {
      pointsToAdd = multiplier;
      referrer.requiresPoints = false;
    } else {
      pointsToAdd = (numberOfPeoplePreviouslyReferred + 1) * multiplier;
    }

    referrer.points += pointsToAdd;
    referee.points += multiplier;

    // push the referrer's id to the refferal's peopleReferred array
    referrer.peopleReferred.push(req.userId);

    // add referrer's id to the user's referredBy field
    referee.referredBy = referrer.user;

    // save the referrer
    await referrer.save();

    // save the referee
    await referee.save();

    res.status(200).json({
      success: true,
      data: {
        points: referee.points,
        alert: `You've got 7 more points!`,
      },
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      success: false,
      error: "Server Error. Please contact us in case this issue perists.",
    });
  }
});

module.exports = router;
