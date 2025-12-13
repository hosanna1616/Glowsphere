const express = require("express");
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  searchUsers,
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { upload } = require("../utils/upload");

const router = express.Router();

router.route("/register").post(authLimiter, registerUser);
router.route("/login").post(authLimiter, authUser);
router.route("/search").get(auth, searchUsers);
router.route("/profile")
  .get(auth, getUserProfile)
  .put(auth, upload.single("avatar"), updateUserProfile);

module.exports = router;
