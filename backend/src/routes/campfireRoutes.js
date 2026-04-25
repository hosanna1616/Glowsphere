const express = require("express");
const multer = require("multer");
const {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  toggleParticipantAudio,
  toggleParticipantVideo,
  getRoomMessages,
  sendTextMessage,
  sendVoiceMessage,
  deleteMessage,
  inviteUser,
  updateRoomSettings,
} = require("../controllers/campfireController");
const auth = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.route("/rooms").post(auth, createRoom).get(auth, getRooms);

router
  .route("/rooms/:id")
  .get(auth, getRoomById)
  .put(auth, updateRoomSettings);

router.route("/rooms/:id/join").put(auth, joinRoom);
router.route("/rooms/:id/leave").post(auth, leaveRoom);
router.route("/rooms/:id/invite").post(auth, inviteUser);
router.route("/rooms/:id/audio").put(auth, toggleParticipantAudio);
router.route("/rooms/:id/video").put(auth, toggleParticipantVideo);
router.route("/rooms/:id/messages").get(auth, getRoomMessages);
router.route("/rooms/:id/messages/text").post(auth, sendTextMessage);
router
  .route("/rooms/:id/messages/voice")
  .post(auth, upload.single("voice"), sendVoiceMessage);
router
  .route("/rooms/:id/messages/:messageId/delete")
  .post(auth, deleteMessage);

module.exports = router;
