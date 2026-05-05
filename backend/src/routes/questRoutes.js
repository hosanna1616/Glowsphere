const express = require("express");
const {
  createQuest,
  getQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  updateProgress,
  addSupporter,
  removeSupporter,
  addComment,
  deleteComment,
  createReminder,
  getMyReminders,
  deactivateReminder,
} = require("../controllers/questController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").post(auth, createQuest).get(auth, getQuests);
router.route("/reminders").post(auth, createReminder).get(auth, getMyReminders);
router.route("/reminders/:reminderId").delete(auth, deactivateReminder);

router
  .route("/:id")
  .get(auth, getQuestById)
  .put(auth, updateQuest)
  .delete(auth, deleteQuest);

router.route("/:id/progress").put(auth, updateProgress);
router.route("/:id/support").post(auth, addSupporter);
router.route("/:id/unsupport").post(auth, removeSupporter);
router.route("/:id/comments").post(auth, addComment);
router.route("/:questId/comments/:commentId").delete(auth, deleteComment);

module.exports = router;
