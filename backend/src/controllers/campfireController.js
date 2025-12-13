const Room = require("../models/Room");
const Message = require("../models/Message");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/upload");

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { name, maxParticipants } = req.body;

    const room = new Room({
      name,
      hostId: req.user._id,
      hostName: req.user.username,
      maxParticipants: maxParticipants || 12,
      participants: [
        {
          userId: req.user._id,
          username: req.user.username,
          isHost: true,
          isAudioOn: true,
          isVideoOn: true,
        },
      ],
    });

    const createdRoom = await room.save();
    res.status(201).json(createdRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (room && room.isActive) {
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found or inactive" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join room
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (room && room.isActive) {
      // Check if user is already in the room
      const isAlreadyParticipant = room.participants.some(
        (participant) =>
          participant.userId.toString() === req.user._id.toString()
      );

      if (isAlreadyParticipant) {
        return res.status(400).json({ message: "User is already in the room" });
      }

      // Check if room is full
      if (room.participants.length >= room.maxParticipants) {
        return res.status(400).json({ message: "Room is full" });
      }

      // Add user to participants
      room.participants.push({
        userId: req.user._id,
        username: req.user.username,
        isHost: false,
        isAudioOn: true,
        isVideoOn: true,
      });

      const updatedRoom = await room.save();
      res.json(updatedRoom);
    } else {
      res.status(404).json({ message: "Room not found or inactive" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (room) {
      // Remove user from participants
      room.participants = room.participants.filter(
        (participant) =>
          participant.userId.toString() !== req.user._id.toString()
      );

      // If host leaves, assign new host or deactivate room
      const hostIndex = room.participants.findIndex(
        (participant) => participant.isHost
      );
      if (hostIndex === -1 && room.participants.length > 0) {
        // Assign first participant as new host
        room.participants[0].isHost = true;
      } else if (room.participants.length === 0) {
        // Deactivate room if no participants left
        room.isActive = false;
      }

      const updatedRoom = await room.save();
      res.json({ message: "Left room successfully" });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle participant audio
const toggleParticipantAudio = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (room) {
      const participant = room.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (participant) {
        // Only user can toggle their own audio or host can toggle anyone's audio
        const isAuthorized =
          userId.toString() === req.user._id.toString() ||
          room.participants.some(
            (p) => p.userId.toString() === req.user._id.toString() && p.isHost
          );

        if (isAuthorized) {
          participant.isAudioOn = !participant.isAudioOn;
          const updatedRoom = await room.save();
          res.json(updatedRoom);
        } else {
          res.status(401).json({ message: "Not authorized to toggle audio" });
        }
      } else {
        res.status(404).json({ message: "Participant not found" });
      }
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle participant video
const toggleParticipantVideo = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (room) {
      const participant = room.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (participant) {
        // Only user can toggle their own video or host can toggle anyone's video
        const isAuthorized =
          userId.toString() === req.user._id.toString() ||
          room.participants.some(
            (p) => p.userId.toString() === req.user._id.toString() && p.isHost
          );

        if (isAuthorized) {
          participant.isVideoOn = !participant.isVideoOn;
          const updatedRoom = await room.save();
          res.json(updatedRoom);
        } else {
          res.status(401).json({ message: "Not authorized to toggle video" });
        }
      } else {
        res.status(404).json({ message: "Participant not found" });
      }
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get room messages
const getRoomMessages = async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.id }).sort({
      timestamp: 1,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send text message
const sendTextMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const message = new Message({
      roomId: req.params.id,
      userId: req.user._id,
      username: req.user.username,
      text,
      isVoice: false,
    });

    const createdMessage = await message.save();
    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send voice message
const sendVoiceMessage = async (req, res) => {
  try {
    let voiceUrl = "";
    let duration = 0;

    // Handle voice file upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        voiceUrl = result.secure_url;
      } catch (uploadError) {
        // Fallback to local file URL if Cloudinary fails
        voiceUrl = `/uploads/${req.file.filename}`;
      }
      duration = req.body.duration ? parseInt(req.body.duration) : 0;
    }

    const message = new Message({
      roomId: req.params.id,
      userId: req.user._id,
      username: req.user.username,
      text: `Voice message (${duration}s)`, // Provide default text for voice messages
      isVoice: true,
      voiceUrl,
      duration,
    });

    const createdMessage = await message.save();
    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Invite user to room
const inviteUser = async (req, res) => {
  try {
    const { username } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room || !room.isActive) {
      return res.status(404).json({ message: "Room not found or inactive" });
    }

    // Check if user is host or participant
    const isAuthorized = room.participants.some(
      (p) => p.userId.toString() === req.user._id.toString()
    );

    if (!isAuthorized) {
      return res
        .status(401)
        .json({ message: "You must be a participant to invite others" });
    }

    // Find user by username
    const userToInvite = await User.findOne({ username: username.toLowerCase() });

    if (!userToInvite) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already in the room
    const isAlreadyParticipant = room.participants.some(
      (p) => p.userId.toString() === userToInvite._id.toString()
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({ message: "User is already in the room" });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Add user to participants
    room.participants.push({
      userId: userToInvite._id,
      username: userToInvite.username,
      isHost: false,
      isAudioOn: true,
      isVideoOn: true,
    });

    const updatedRoom = await room.save();
    res.json({
      message: `Successfully invited ${username} to the room`,
      room: updatedRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update room settings
const updateRoomSettings = async (req, res) => {
  try {
    const { name, maxParticipants, isActive } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is host
    const isHost = room.participants.some(
      (p) =>
        p.userId.toString() === req.user._id.toString() && p.isHost === true
    );

    if (!isHost) {
      return res
        .status(401)
        .json({ message: "Only the host can update room settings" });
    }

    if (name) room.name = name;
    if (maxParticipants) room.maxParticipants = maxParticipants;
    if (isActive !== undefined) room.isActive = isActive;

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  toggleParticipantAudio,
  toggleParticipantVideo,
  getRoomMessages,
  sendTextMessage,
  sendVoiceMessage,
  inviteUser,
  updateRoomSettings,
};
