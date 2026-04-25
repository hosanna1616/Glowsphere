const express = require("express");
const auth = require("../middleware/auth");
const {
  startSession,
  completeSession,
  getMySessions,
  getActiveSession,
  saveReadingProgress,
} = require("../controllers/studySessionController");

const router = express.Router();

router.route("/").get(auth, getMySessions).post(auth, startSession);
router.route("/active").get(auth, getActiveSession);
router.route("/:id/complete").put(auth, completeSession);
router.route("/materials/:id/progress").post(auth, saveReadingProgress);

module.exports = router;
