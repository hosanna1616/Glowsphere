const mongoose = require("mongoose");

const voiceNoteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alias: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const revealDecisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decision: {
      type: String,
      enum: ["pending", "yes", "no"],
      default: "pending",
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const soulMatchSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        alias: {
          type: String,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    sharedSignals: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "closed", "revealed"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revealDecisions: [revealDecisionSchema],
    voiceNotes: [voiceNoteSchema],
    jointMemory: {
      title: {
        type: String,
        default: "",
        maxlength: 100,
      },
      body: {
        type: String,
        default: "",
        maxlength: 1200,
      },
      destinations: [
        {
          type: String,
          trim: true,
        },
      ],
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    closedReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

soulMatchSchema.index({ "participants.userId": 1, status: 1 });
soulMatchSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("SoulMatch", soulMatchSchema);
