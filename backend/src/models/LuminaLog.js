const mongoose = require("mongoose");

const luminaLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["release", "glow_up", "future_self", "gratitude_glow"],
      required: true,
    },
    theme: {
      type: String,
      enum: ["rose_gold", "moonlit", "fairy_lights", "sunset_blush"],
      default: "rose_gold",
    },
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    durationSeconds: {
      type: Number,
      min: 1,
      max: 60,
      required: true,
    },
    echoReply: {
      type: String,
      required: true,
      trim: true,
    },
    reelStatus: {
      type: String,
      enum: ["none", "weekly_ready"],
      default: "none",
    },
  },
  { timestamps: true }
);

luminaLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("LuminaLog", luminaLogSchema);
