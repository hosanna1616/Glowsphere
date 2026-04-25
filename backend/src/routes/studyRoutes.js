const express = require("express");
const multer = require("multer");
const {
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
  addHighlight,
  removeHighlight,
  downloadStudyMaterial,
} = require("../controllers/studyController");
const auth = require("../middleware/auth");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router
  .route("/")
  .post(auth, upload.single("file"), createStudyMaterial)
  .get(auth, getStudyMaterials);

router
  .route("/:id")
  .get(auth, getStudyMaterialById)
  .put(auth, updateStudyMaterial)
  .delete(auth, deleteStudyMaterial);

router.route("/:id/highlights").post(auth, addHighlight);
router.route("/:id/highlights/:highlightId").delete(auth, removeHighlight);
router.route("/:id/download").get(auth, downloadStudyMaterial);

module.exports = router;
