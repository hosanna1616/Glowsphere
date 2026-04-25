const mongoose = require("mongoose");

const suitcaseItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ootd", "travel_photo", "outfit_selfie", "story"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    caption: {
      type: String,
      default: "",
      maxlength: 600,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    colorMood: {
      type: String,
      default: "",
      maxlength: 40,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const soulSuitcaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vibeWords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    styleTags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    destinationDreams: [
      {
        type: String,
        trim: true,
      },
    ],
    energyNote: {
      type: String,
      default: "",
      maxlength: 240,
    },
    privacyMode: {
      type: String,
      enum: ["anonymous", "reveal_on_mutual_yes"],
      default: "reveal_on_mutual_yes",
    },
    weeklyMatcher: {
      lastRequestedAt: {
        type: Date,
        default: null,
      },
    },
    items: [suitcaseItemSchema],
  },
  {
    timestamps: true,
  }
);

soulSuitcaseSchema.index({ styleTags: 1 });
soulSuitcaseSchema.index({ vibeWords: 1 });

module.exports = mongoose.model("SoulSuitcase", soulSuitcaseSchema);
