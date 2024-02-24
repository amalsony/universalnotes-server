const AccessCode = require("../models/AccessCode");

async function createAccessCode(referrer, isSingleUse) {
  const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newAccessCode = new AccessCode({
    referrer,
    isSingleUse,
    accessCode,
    createdAt: new Date().toISOString(),
  });

  await newAccessCode.save();
  return newAccessCode;
}

// async function createAccessCode(referrer, isSingleUse, customAccessCode) {
//   const accessCode = customAccessCode
//     ? customAccessCode
//     : Math.random().toString(36).substring(2, 8).toUpperCase();
//   const newAccessCode = new AccessCode({
//     referrer,
//     isSingleUse,
//     accessCode,
//     createdAt: new Date().toISOString(),
//   });

//   await newAccessCode.save();
//   return newAccessCode;
// }

module.exports = { createAccessCode };
