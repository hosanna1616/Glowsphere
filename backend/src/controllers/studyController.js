const StudyMaterial = require("../models/StudyMaterial");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/upload");

// Create a new study material
const createStudyMaterial = async (req, res) => {
  try {
    const { title, description, tags, isPublic, fileType } = req.body;
    let fileUrl = "";

    // Handle file upload if present
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      fileUrl = result.secure_url;
    }

    const studyMaterial = new StudyMaterial({
      userId: req.user._id,
      title,
      description,
      fileUrl,
      fileType,
      tags,
      isPublic: isPublic || false,
    });

    const createdStudyMaterial = await studyMaterial.save();
    res.status(201).json(createdStudyMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all study materials
const getStudyMaterials = async (req, res) => {
  try {
    // Get user's own materials and public materials from others
    const studyMaterials = await StudyMaterial.find({
      $or: [{ userId: req.user._id }, { isPublic: true }],
    }).sort({ createdAt: -1 });

    res.json(studyMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get study material by ID
const getStudyMaterialById = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user can access this material
      if (
        studyMaterial.userId.toString() !== req.user._id.toString() &&
        !studyMaterial.isPublic
      ) {
        return res
          .status(401)
          .json({ message: "Not authorized to access this study material" });
      }

      // Increment view count
      studyMaterial.views += 1;
      await studyMaterial.save();

      res.json(studyMaterial);
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update study material
const updateStudyMaterial = async (req, res) => {
  try {
    const { title, description, tags, isPublic } = req.body;

    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user is owner of the study material
      if (studyMaterial.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to update this study material" });
      }

      studyMaterial.title = title || studyMaterial.title;
      studyMaterial.description = description || studyMaterial.description;
      studyMaterial.tags = tags || studyMaterial.tags;
      studyMaterial.isPublic =
        isPublic !== undefined ? isPublic : studyMaterial.isPublic;

      const updatedStudyMaterial = await studyMaterial.save();
      res.json(updatedStudyMaterial);
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete study material
const deleteStudyMaterial = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user is owner of the study material
      if (studyMaterial.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this study material" });
      }

      await StudyMaterial.deleteOne({ _id: studyMaterial._id });
      res.json({ message: "Study material removed" });
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add highlight to study material
const addHighlight = async (req, res) => {
  try {
    const { text, color, position } = req.body;

    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user is owner of the study material
      if (studyMaterial.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({
            message: "Not authorized to add highlights to this study material",
          });
      }

      const highlight = {
        text,
        color: color || "#FFD700",
        position,
      };

      studyMaterial.highlights.push(highlight);
      const updatedStudyMaterial = await studyMaterial.save();

      res
        .status(201)
        .json(
          updatedStudyMaterial.highlights[
            updatedStudyMaterial.highlights.length - 1
          ]
        );
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove highlight from study material
const removeHighlight = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user is owner of the study material
      if (studyMaterial.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized to remove highlights from this study material",
          });
      }

      // Remove highlight
      studyMaterial.highlights = studyMaterial.highlights.filter(
        (highlight) => highlight._id.toString() !== req.params.highlightId
      );

      const updatedStudyMaterial = await studyMaterial.save();
      res.json({ message: "Highlight removed" });
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download study material
const downloadStudyMaterial = async (req, res) => {
  try {
    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (studyMaterial) {
      // Check if user can access this material
      if (
        studyMaterial.userId.toString() !== req.user._id.toString() &&
        !studyMaterial.isPublic
      ) {
        return res
          .status(401)
          .json({ message: "Not authorized to download this study material" });
      }

      // Increment download count
      studyMaterial.downloads += 1;
      await studyMaterial.save();

      res.json({ downloadUrl: studyMaterial.fileUrl });
    } else {
      res.status(404).json({ message: "Study material not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
  addHighlight,
  removeHighlight,
  downloadStudyMaterial,
};
