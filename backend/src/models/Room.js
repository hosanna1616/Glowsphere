const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  username: {
    type: String,
    required: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  isAudioOn: {
    type: Boolean,
    default: true,
  },
  isVideoOn: {
    type: Boolean,
    default: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    maxParticipants: {
      type: Number,
      default: 12,
    },
    participants: [participantSchema],
    isRecording: {
      type: Boolean,
      default: false,
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

// Index for better query performance
roomSchema.index({ hostId: 1 });
roomSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Room", roomSchema);
