// isAuthenticated middleware
const isPassportAuth = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // Proceed to the next middleware/route handler
  }

  res.status(400).json({
    success: false,
    error: "You're not logged in.",
  });
};

module.exports = isPassportAuth;
