const mongoose = require("mongoose");

const reflectionSchema = new mongoose.Schema(
  {
    excited: { type: Number, min: 1, max: 5 },
    heavyOrEnergizing: { type: String, trim: true, maxlength: 500 },
    dailyImagine: { type: String, trim: true, maxlength: 2000 },
    likeYouOrOther: { type: String, trim: true, maxlength: 500 },
    attractedMost: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: false },
);

const exploredSchema = new mongoose.Schema(
  {
    pathId: { type: String, required: true },
    exploredAt: { type: Date, default: Date.now },
    reflection: reflectionSchema,
  },
  { _id: false },
);

const capsuleSchema = new mongoose.Schema(
  {
    capsuleId: { type: String, required: true },
    pathId: { type: String, required: true },
    title: { type: String, trim: true, maxlength: 200 },
    note: { type: String, trim: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const parallelBloomProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    onboarding: { type: mongoose.Schema.Types.Mixed, default: {} },
    rediscover: { type: mongoose.Schema.Types.Mixed, default: {} },
    exploredPaths: { type: [exploredSchema], default: [] },
    capsules: { type: [capsuleSchema], default: [] },
    dailyState: {
      lastEngagementDate: { type: String, default: "" },
      streak: { type: Number, default: 0 },
      rotationIndex: { type: Number, default: 0 },
    },
    explorationCount: { type: Number, default: 0 },
    premium: { type: Boolean, default: false },
  },
  { timestamps: true },
);

parallelBloomProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("ParallelBloomProfile", parallelBloomProfileSchema);
