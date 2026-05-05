const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "glowsphere_secret_key"
    );
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Token invalid, access denied" });
    }
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ message: "Session expired, please sign in again" });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalid, access denied" });
  }
};

module.exports = auth;
