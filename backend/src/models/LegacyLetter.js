const mongoose = require("mongoose");

const legacyLetterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientType: {
      type: String,
      enum: ["future_self", "future_daughter"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2400,
    },
    milestoneType: {
      type: String,
      enum: ["days_since_joined", "quests_completed", "challenges_completed"],
      required: true,
    },
    milestoneTarget: {
      type: Number,
      required: true,
      min: 1,
    },
    unlockedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

legacyLetterSchema.index({ userId: 1, unlockedAt: 1, createdAt: -1 });

module.exports = mongoose.model("LegacyLetter", legacyLetterSchema);
