const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
    },
    coveragePercent: {
      type: Number,
      default: 0,
    },
    isPresent: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const inviteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      default: "",
    },
    emoji: {
      type: String,
      enum: ["❤️", "🔥", "💪", "🌟"],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const debriefEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      default: "",
    },
    entryType: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
    message: {
      type: String,
      default: "",
    },
    voiceUrl: {
      type: String,
      default: "",
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const studyPodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    podType: {
      type: String,
      enum: ["silent", "private"],
      default: "silent",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    invites: {
      type: [inviteSchema],
      default: [],
    },
    sharedCoveragePercent: {
      type: Number,
      default: 0,
    },
    sessionState: {
      status: {
        type: String,
        enum: ["idle", "active", "debrief"],
        default: "idle",
      },
      timerMinutes: {
        type: Number,
        default: 25,
      },
      trackKey: {
        type: String,
        default: "",
      },
      startedAt: {
        type: Date,
        default: null,
      },
      endsAt: {
        type: Date,
        default: null,
      },
      debriefEndsAt: {
        type: Date,
        default: null,
      },
    },
    silentModeLocked: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    debriefEntries: {
      type: [debriefEntrySchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

studyPodSchema.index({ ownerId: 1, createdAt: -1 });
studyPodSchema.index({ "participants.userId": 1 });
studyPodSchema.index({ "invites.userId": 1, "invites.status": 1 });

module.exports = mongoose.model("StudyPod", studyPodSchema);
