const express = require("express");
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  logoutAllSessions,
  deleteAccount,
  searchUsers,
  getFriends,
  addFriend,
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { profileUpload } = require("../utils/upload");

const router = express.Router();

router.route("/register").post(authLimiter, registerUser);
router.route("/login").post(authLimiter, authUser);
router.route("/settings").put(auth, updateUserSettings);
router.route("/change-password").post(auth, changePassword);
router.route("/logout-all").post(auth, logoutAllSessions);
router.route("/account").delete(auth, deleteAccount);
router.route("/search").get(auth, searchUsers);
router.route("/friends").get(auth, getFriends).post(auth, addFriend);
router
  .route("/profile")
  .get(auth, getUserProfile)
  .put(auth, profileUpload.single("avatar"), updateUserProfile);

module.exports = router;
