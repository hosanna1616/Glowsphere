const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedEntityType: {
      type: String,
      enum: [
        "post",
        "comment",
        "quest",
        "message",
        "friend_request",
        "study_pod",
        "study_session",
        "study_material",
      ],
    },
    actionPath: {
      type: String,
      default: "",
    },
    actorUsername: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
