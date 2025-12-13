const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "#FFD700",
  },
  position: {
    start: Number,
    end: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const studyMaterialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      enum: ["pdf", "notebook", "resource"],
      default: "resource",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    pages: [
      {
        title: String,
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    highlights: [highlightSchema],
    tags: [
      {
        type: String,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
studyMaterialSchema.index({ userId: 1 });
studyMaterialSchema.index({ fileType: 1 });
studyMaterialSchema.index({ tags: 1 });
studyMaterialSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);
