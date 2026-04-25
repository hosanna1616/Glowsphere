const express = require("express");
const auth = require("../middleware/auth");
const {
  getOverview,
  updateSuitcaseProfile,
  addSuitcaseItem,
  deleteSuitcaseItem,
  findSoulSister,
  addVoiceNote,
  deleteVoiceNote,
  saveJointMemory,
  updateRevealDecision,
  closeMatch,
  createLegacyLetter,
  deleteLegacyLetter,
} = require("../controllers/echoesController");

const router = express.Router();

router.get("/", auth, getOverview);
router.put("/suitcase", auth, updateSuitcaseProfile);
router.post("/suitcase/items", auth, addSuitcaseItem);
router.delete("/suitcase/items/:itemId", auth, deleteSuitcaseItem);
router.post("/matches/find", auth, findSoulSister);
router.post("/matches/:matchId/voice-notes", auth, addVoiceNote);
router.delete("/matches/:matchId/voice-notes/:noteId", auth, deleteVoiceNote);
router.put("/matches/:matchId/joint-memory", auth, saveJointMemory);
router.put("/matches/:matchId/reveal", auth, updateRevealDecision);
router.delete("/matches/:matchId", auth, closeMatch);
router.post("/letters", auth, createLegacyLetter);
router.delete("/letters/:letterId", auth, deleteLegacyLetter);

module.exports = router;
