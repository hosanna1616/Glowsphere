const express = require("express");
const auth = require("../middleware/auth");
const {
  getState,
  saveOnboarding,
  saveRediscover,
  getPath,
  startExplore,
  saveReflection,
  postCompare,
  getDaily,
  addCapsule,
  deleteCapsule,
} = require("../controllers/parallelBloomController");

const router = express.Router();

router.get("/", auth, getState);
router.post("/onboarding", auth, saveOnboarding);
router.post("/rediscover", auth, saveRediscover);
router.get("/daily", auth, getDaily);
router.get("/paths/:pathId", auth, getPath);
router.post("/explore/:pathId", auth, startExplore);
router.post("/reflection", auth, saveReflection);
router.post("/compare", auth, postCompare);
router.post("/capsules", auth, addCapsule);
router.delete("/capsules/:capsuleId", auth, deleteCapsule);

module.exports = router;
