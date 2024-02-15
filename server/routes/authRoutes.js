const express = require("express");
const router = express.Router();

// auth imports
const jwt = require("jsonwebtoken");
const passport = require("passport");
const axios = require("axios");
const auth = require("../middleware/auth");
const authNoPhone = require("../middleware/authNoPhone");
const { certToPEM } = require("pem-jwk");
const jwkToPem = require("jwk-to-pem");
const { OAuth2Client } = require("google-auth-library");

// Twilio imports
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient = require("twilio")(accountSid, authToken);

// Models
const User = require("../models/User");
const Note = require("../models/Note");

// config imports
const { country_codes } = require("../config/supportedCountries");

// ulitilities
const { defaultProfilePics } = require("../utilities/defaultProfilePics");
require("../services/Passport");

// Config
const isPhoneRequired = process.env.PHONE_REQUIRED === "true";

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

router.post("/google-prev", async (req, res) => {
  // get the token from the request body

  const { token } = req.body;

  // validate token (check if there is a token or if it starts with ya29.)
  if (!token) {
    return res.status(400).json({
      success: false,
      error: "No token provided",
    });
  }

  const googleResponse = await axios.get(
    `https://www.googleapis.com/userinfo/v2/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log("googleResponse.data", googleResponse.data);

  // get the user's email
  const email = googleResponse?.data?.email;

  // check if the user exists in the database
  const user = await User.findOne({ email });

  // if the user exists, generate a token and send it back
  if (user) {
    if (!user.phoneConfirmed && !isPhoneRequired) {
      user.phoneConfirmed = true;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "90d",
      }
    );

    const sendUser = {
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
    };

    // update the user to use google auth if it's false
    if (!user.usesGoogleAuth) {
      user.usesGoogleAuth = true;
      if (!user.googleID) {
        user.googleID = googleResponse.data.id;
      }
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: sendUser,
        isPhoneVerified: isPhoneRequired ? user.phoneConfirmed : true,
      },
    });
  }

  // if the user does not exist, create a new user and generate a token

  // get the user's name
  const name = googleResponse.data.name;

  // create a new user
  const newUser = new User({
    name,
    email,
    createdAt: new Date().toISOString(),
    googleID: googleResponse.data.id,
    usesGoogleAuth: true,
    username: email,
    profilePic: googleResponse.data.picture,
    emailConfirmed: true,
    phoneConfirmed: isPhoneRequired ? false : true,
  });

  // save the user to the database
  await newUser.save();

  // create a referral and set requiresPoints to false
  const referral = new Referral({
    user: newUser._id,
    referralCode: `${newUser.name?.split(" ")[0]?.toUpperCase()}${Math.floor(
      1000 + Math.random() * 9000
    )}`,
    requiresPoints: true,
    points: 40,
    createdAt: new Date().toISOString(),
  });

  await referral.save();

  // generate a token
  const jwtToken = jwt.sign(
    {
      id: newUser._id,
      email: newUser.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "90d",
    }
  );

  // send the token back
  res.status(200).json({
    success: true,
    data: {
      token: jwtToken,
      user: {
        name: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
      isPhoneVerified: isPhoneRequired ? newUser.phoneConfirmed : true,
    },
  });
});

router.post("/google-web", async (req, res) => {
  // get the token from the request body

  const { token } = req.body;

  // validate token
  if (!token) {
    return res.status(400).json({
      success: false,
      error: "No token provided",
    });
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let googleResponse;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    googleResponse = ticket.getPayload();
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  // get the user's email
  const email = googleResponse?.email;

  // check if the user exists in the database
  const user = await User.findOne({ email });

  // if the user exists, generate a token and send it back
  if (user) {
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "90d",
      }
    );

    const sendUser = {
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
    };

    // update the user to use google auth if it's false
    if (!user.usesGoogleAuth) {
      user.usesGoogleAuth = true;
      if (!user.googleID) {
        user.googleID = googleResponse.sub;
      }
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: sendUser,
        isPhoneVerified: true,
      },
    });
  }

  // if the user does not exist, create a new user and generate a token

  // get the user's name
  const name = googleResponse.name;

  // create a new user
  const newUser = new User({
    name,
    email,
    createdAt: new Date().toISOString(),
    googleID: googleResponse.sub,
    usesGoogleAuth: true,
    username: email,
    profilePic: googleResponse.picture,
    emailConfirmed: true,
    phoneConfirmed: true,
  });

  // save the user to the database
  await newUser.save();

  // generate a token
  const jwtToken = jwt.sign(
    {
      id: newUser._id,
      email: newUser.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "90d",
    }
  );

  // create a referral and set requiresPoints to false
  const referral = new Referral({
    user: newUser._id,
    referralCode: `${newUser.name.split(" ")[0].toUpperCase()}${Math.floor(
      1000 + Math.random() * 9000
    )}`,
    requiresPoints: false,
    points: 40,
    createdAt: new Date().toISOString(),
  });

  await referral.save();

  // send the token back
  res.status(200).json({
    success: true,
    data: {
      token: jwtToken,
      user: {
        name: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
      isPhoneVerified: newUser.phoneConfirmed,
    },
  });
});

router.post("/apple", async (req, res) => {
  const { identityToken, fullName, appleUserID } = req.body;

  // validate token (check if there is a token)
  if (!identityToken) {
    return res.status(400).json({
      success: false,
      error: "Missing token",
    });
  }

  // fetch apple's public keys
  const applePublicKeyResponse = await axios.get(
    "https://appleid.apple.com/auth/keys"
  );

  // get the public keys
  const publicKeys = applePublicKeyResponse.data.keys;

  let decodedToken;

  try {
    decodedToken = jwt.decode(identityToken, { complete: true });
  } catch (err) {
    console.error("Token decoding failed:", err);
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  const kid = decodedToken.header.kid;
  const publicKey = publicKeys.find((key) => key.kid === kid);

  try {
    if (!publicKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    // convert jwk key to pem
    const pem = jwkToPem(publicKey);

    const verificationOptions = {
      algorithms: [publicKey.alg],
    };

    let verifiedToken;

    try {
      // Verify the token
      verifiedToken = jwt.verify(identityToken, pem, verificationOptions);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: "Token verification failed",
      });
    }

    // get the user's email
    const email = verifiedToken.email;

    // check if the user exists in the database
    const user = await User.findOne({ email });

    // if the user exists, generate a token and send it back
    if (user) {
      if (!user.phoneConfirmed && !isPhoneRequired) {
        user.phoneConfirmed = true;
        await user.save();
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "90d",
        }
      );

      const sendUser = {
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
      };

      // update the user to use apple auth if it's false
      if (!user.usesAppleAuth) {
        user.usesAppleAuth = true;
        if (!user.appleID && appleUserID) {
          user.appleID = appleUserID;
        }
        await user.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: sendUser,
          isPhoneVerified: isPhoneRequired ? user.phoneConfirmed : true,
        },
      });
    }

    // if the user does not exist, create a new user and generate a token

    if (!fullName || typeof fullName !== "string") {
      console.log("Missing full name");
      return res.status(400).json({
        success: false,
        error: "Missing full name",
      });
    }

    // create a new user
    const newUser = new User({
      name: fullName,
      email,
      createdAt: new Date().toISOString(),
      appleID: appleUserID,
      usesAppleAuth: true,
      username: email,
      profilePic: `https://i.imgur.com/${
        defaultProfilePics.find(
          (pic) => pic.initial === fullName[0].toUpperCase()
        ).fileName
      }`,
      emailConfirmed: true,
      phoneConfirmed: isPhoneRequired ? false : true,
    });

    // save the user to the database
    await newUser.save();

    // create a referral and set requiresPoints to false
    const referral = new Referral({
      user: newUser._id,
      referralCode: `${newUser.name?.split(" ")[0]?.toUpperCase()}${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      requiresPoints: true,
      points: 40,
      createdAt: new Date().toISOString(),
    });

    await referral.save();

    // generate a token
    const jwtToken = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "90d",
      }
    );

    // send the token back
    res.status(200).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          name: newUser.name,
          email: newUser.email,
          profilePic: newUser.profilePic,
        },
        isPhoneVerified: isPhoneRequired ? newUser.phoneConfirmed : true,
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.delete("/delete-account", auth, async (req, res) => {
  try {
    // Delete all notes of the user
    await Note.deleteMany({ user: req.userId });

    // Delete the user object itself
    await User.findByIdAndDelete(req.userId);

    res.status(200).json({
      success: true,
      data: {
        message: "Account Deleted",
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

module.exports = router;
