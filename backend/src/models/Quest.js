const mongoose = require("mongoose");

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
    xp: {
      type: Number,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    deadline: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    progress: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: {
          type: String,
          required: true,
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    supporters: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: {
          type: String,
          required: true,
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
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
questSchema.index({ difficulty: 1 });
questSchema.index({ createdBy: 1 });
questSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Quest", questSchema);
