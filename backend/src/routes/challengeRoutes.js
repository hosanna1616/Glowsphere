const express = require("express");
const {
  createChallenge,
  getChallenges,
  getChallengeById,
  joinChallenge,
  updateProgress,
  leaveChallenge,
  updateChallenge,
  deleteChallenge,
} = require("../controllers/challengeController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").post(auth, createChallenge).get(auth, getChallenges);

router
  .route("/:id")
  .get(auth, getChallengeById)
  .put(auth, updateChallenge)
  .delete(auth, deleteChallenge);

router.route("/:id/join").post(auth, joinChallenge);
router.route("/:id/leave").post(auth, leaveChallenge);
router.route("/:id/progress").put(auth, updateProgress);

module.exports = router;






