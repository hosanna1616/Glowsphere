const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const {
  listPods,
  getPodById,
  createPod,
  inviteToPod,
  respondToInvite,
  joinPod,
  updateProgress,
  startPodSession,
  openDebrief,
  sendReaction,
  sendDebriefText,
  sendDebriefVoice,
} = require("../controllers/studyPodController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.route("/").get(auth, listPods).post(auth, createPod);
router.route("/:id").get(auth, getPodById);
router.route("/:id/join").post(auth, joinPod);
router.route("/:id/invite").post(auth, inviteToPod);
router.route("/:id/invite/respond").post(auth, respondToInvite);
router.route("/:id/progress").post(auth, updateProgress);
router.route("/:id/session/start").post(auth, startPodSession);
router.route("/:id/session/debrief").post(auth, openDebrief);
router.route("/:id/reactions").post(auth, sendReaction);
router.route("/:id/debrief/text").post(auth, sendDebriefText);
router.route("/:id/debrief/voice").post(auth, upload.single("voice"), sendDebriefVoice);

module.exports = router;
