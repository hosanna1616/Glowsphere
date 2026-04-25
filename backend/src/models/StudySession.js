const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studyMaterialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      default: null,
    },
    podId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyPod",
      default: null,
    },
    timerPresetMinutes: {
      type: Number,
      enum: [25, 50, 90, 5],
      default: 25,
    },
    actualDurationMinutes: {
      type: Number,
      default: 25,
    },
    trackKey: {
      type: String,
      default: "",
    },
    mode: {
      type: String,
      enum: ["focus", "break"],
      default: "focus",
    },
    status: {
      type: String,
      enum: ["idle", "active", "completed", "cancelled"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    coverageAtStart: {
      type: Number,
      default: 0,
    },
    coverageAtEnd: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, createdAt: -1 });
studySessionSchema.index({ podId: 1, status: 1 });

module.exports = mongoose.model("StudySession", studySessionSchema);
