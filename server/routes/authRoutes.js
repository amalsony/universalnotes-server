const express = require("express");
const router = express.Router();

// auth imports
const jwt = require("jsonwebtoken");
const axios = require("axios");
const auth = require("../middleware/auth");
const authNoPhone = require("../middleware/authNoPhone");
const { certToPEM } = require("pem-jwk");
const jwkToPem = require("jwk-to-pem");

// Twilio imports
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient = require("twilio")(accountSid, authToken);

// Models
const User = require("../models/User");
const Referral = require("../models/Referral");

// config imports
const { country_codes } = require("../config/supportedCountries");

// ulitilities
const { defaultProfilePics } = require("../utilities/defaultProfilePics");

router.post("/add-phone", authNoPhone, async (req, res) => {
  const { phone, countryCode, country } = req.body;

  // check if the user exists
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(400).json({
      success: false,
      error: "You're not logged in",
    });
  }

  // check if phone number is already in use
  const checkPhoneUser = await User.findOne({
    phone: `${countryCode}${phone}`,
  });
  if (
    checkPhoneUser &&
    checkPhoneUser._id !== user._id &&
    checkPhoneUser.phoneConfirmed
  ) {
    return res.status(400).json({
      success: false,
      error: "Phone number already in use",
    });
  }

  // check if the user has already verified their phone number
  if (user.phoneConfirmed) {
    return res.status(400).json({
      success: false,
      error: "Phone number already verified",
    });
  }

  // validate phone number
  if (!phone) {
    return res.status(400).json({
      success: false,
      error: "Please provide a phone number",
    });
  }

  // validate country code
  if (!countryCode) {
    return res.status(400).json({
      success: false,
      error: "Please provide a country code",
    });
  }

  // validate country
  if (!country) {
    return res.status(400).json({
      success: false,
      error: "Please provide a country",
    });
  }

  // check if the country code is supported
  if (!country_codes.includes(country)) {
    return res.status(400).json({
      success: false,
      error: "Unsupported country",
    });
  }

  // send the verification code
  try {
    const verificationRequest = await twilioClient.verify.v2
      .services(twilioVerifyServiceSid)
      .verifications.create({
        to: `${countryCode}${phone}`,
        channel: "sms", // You can also use "call" for voice-based verification
      });

    if (verificationRequest.status === "pending") {
      // update the user's phone number
      user.pendingPhoneNumber = `${countryCode}${phone}`;
      user.country = country;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        verification: {
          status: verificationRequest.status,
          phone: verificationRequest.to,
        },
      },
    });
  } catch (error) {
    if (error.message.startsWith("Invalid parameter `To`")) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number",
      });
    }

    res.status(400).json({
      success: false,
      error: "Something went wrong",
    });
  }
});

router.post("/verify-phone", authNoPhone, async (req, res) => {
  const { phone, code } = req.body;

  // check if the user exists
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(400).json({
      success: false,
      error: "You're not logged in",
    });
  }

  // check if the user has already verified their phone number
  if (user.phoneConfirmed) {
    return res.status(400).json({
      success: false,
      error: "Phone number already verified",
    });
  }

  // validate phone number
  if (!phone) {
    return res.status(400).json({
      success: false,
      error: "Please provide a phone number",
    });
  }

  // check if the phone number is the same as the one in the database
  if (phone !== user.pendingPhoneNumber) {
    return res.status(400).json({
      success: false,
      error: "Invalid phone number",
    });
  }

  // validate code
  if (!code) {
    return res.status(400).json({
      success: false,
      error: "Please provide a code",
    });
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(twilioVerifyServiceSid)
      .verificationChecks.create({
        to: phone,
        code,
      });

    // check if the verification was successful
    if (verification.status === "approved") {
      // update the user's phone number
      user.phoneConfirmed = true;
      user.phone = user.pendingPhoneNumber;
      user.pendingPhoneNumber = null;
      await user.save();

      // create the referral code for the user, it's their first name + 4 random digits (e.g. CHLOE0504)
      let max = 9999;

      function createReferralCode(firstName) {
        const referralCode = `${firstName.toUpperCase()}${Math.floor(
          1000 + Math.random() * 9000
        )}`;

        const referral = Referral.findOne({ referralCode: referralCode });
        console.log(referral);

        if (max === 0) {
          return Math.floor(10000 + Math.random() * 90000);
        }

        if (
          referral &&
          referral.user &&
          referral.user.toString() !== user._id.toString()
        ) {
          max--;
          return createReferralCode(firstName);
        }

        return referralCode;
      }

      const referralCode = createReferralCode(user.name.split(" ")[0]);

      // create a new referral
      const referral = new Referral({
        user: user._id,
        referralCode: referralCode,
        requiresPoints: true,
        points: 40,
        createdAt: new Date().toISOString(),
      });

      await referral.save();

      res.status(200).json({
        success: true,
        data: {
          verification,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid code",
      });
    }
  } catch (error) {
    console.log("entered catch block");
    console.log(error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/google", async (req, res) => {
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
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
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
        isPhoneVerified: user.phoneConfirmed,
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
      expiresIn: "30d",
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
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
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
          isPhoneVerified: user.phoneConfirmed,
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
        expiresIn: "30d",
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
        isPhoneVerified: newUser.phoneConfirmed,
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

module.exports = router;
