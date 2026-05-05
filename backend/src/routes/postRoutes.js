const express = require("express");
const multer = require("multer");
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  savePost,
  reportPost,
  getSavedPosts,
  getReportedPosts,
  updateReportStatus,
} = require("../controllers/postController");
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

router
  .route("/")
  .post(auth, upload.single("media"), createPost)
  .get(auth, getPosts);

router.route("/saved").get(auth, getSavedPosts);

router
  .route("/:id")
  .get(auth, getPostById)
  .put(auth, upload.single("media"), updatePost)
  .delete(auth, deletePost);

router.route("/:id/like").put(auth, likePost);
router.route("/:id/save").post(auth, savePost);
router.route("/:id/report").post(auth, reportPost);
router.route("/reports/queue").get(auth, getReportedPosts);
router
  .route("/reports/:postId/:reportId/status")
  .put(auth, updateReportStatus);
router.route("/:id/comments").post(auth, addComment);
router.route("/:postId/comments/:commentId").delete(auth, deleteComment);

module.exports = router;
