const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    tags: [
      {
        type: String,
      },
    ],
    mentions: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          },
        ],
      },
    ],
    category: {
      type: String,
      enum: ["general", "career_tip", "creativity", "question", "tip"],
      default: "general",
    },
    savedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reportCategory: {
          type: String,
          enum: [
            "harmful_or_dangerous",
            "hate_or_harassment",
            "violence_or_threat",
            "nudity_or_sexual",
            "misinformation",
            "spam_or_scam",
            "other",
          ],
          default: "other",
        },
        reason: {
          type: String,
          default: "Inappropriate content",
        },
        additionalDetails: {
          type: String,
          default: "",
        },
        moderationStatus: {
          type: String,
          enum: ["pending", "under_review", "resolved", "dismissed"],
          default: "pending",
        },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ userId: 1 });
postSchema.index({ "reports.userId": 1 });
postSchema.index({ "reports.moderationStatus": 1 });

module.exports = mongoose.model("Post", postSchema);
