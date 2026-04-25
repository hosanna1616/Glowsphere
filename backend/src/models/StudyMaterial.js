const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#FFD700",
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    pageLabel: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    position: {
      start: Number,
      end: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastPageRead: {
      type: Number,
      default: 1,
    },
    pagesVisited: {
      type: [Number],
      default: [],
    },
    pagesHighlighted: {
      type: [Number],
      default: [],
    },
    coveragePercent: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const pdfTextPageSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

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
    originalFileName: {
      type: String,
      default: "",
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
    readingProgress: [readingProgressSchema],
    pdfMetadata: {
      totalPages: {
        type: Number,
        default: 0,
      },
      extractedAt: {
        type: Date,
        default: null,
      },
      source: {
        type: String,
        enum: ["local", "cloudinary", "external", "unknown"],
        default: "unknown",
      },
      textPages: {
        type: [pdfTextPageSchema],
        default: [],
      },
    },
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
