const mongoose = require("mongoose");

const questReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quest",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    remindAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuestReminder", questReminderSchema);
