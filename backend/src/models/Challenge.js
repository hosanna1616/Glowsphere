const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "upcoming"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in days
      required: true,
    },
    rewards: [
      {
        type: String,
      },
    ],
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    requirements: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
challengeSchema.index({ status: 1 });
challengeSchema.index({ deadline: 1 });
challengeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Challenge", challengeSchema);






