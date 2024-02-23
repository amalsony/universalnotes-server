const AccessCode = require("../models/AccessCode");

async function createAccessCode(referrer, isSingleUse) {
  console.log("function createAccessCode called");
  const accessCode = Math.random().toString(36).substring(7).toUpperCase();
  const newAccessCode = new AccessCode({
    referrer,
    isSingleUse,
    accessCode,
    createdAt: new Date().toISOString(),
  });

  await newAccessCode.save();
  return newAccessCode;
}

module.exports = { createAccessCode };
