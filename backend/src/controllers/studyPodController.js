const StudyPod = require("../models/StudyPod");
const User = require("../models/User");
const { createNotification } = require("./notificationController");
const { getIo } = require("../socket");

const allowedReactions = ["❤️", "🔥", "💪", "🌟"];

const emitPodUpdate = (podId, eventName, payload) => {
  const io = getIo();
  if (io) {
    io.to(`study_pod:${podId}`).emit(eventName, payload);
  }
};

const formatParticipant = (user, role = "member") => ({
  userId: user._id,
  username: user.username,
  name: user.name,
  avatar: user.avatar || "",
  role,
  coveragePercent: 0,
  isPresent: true,
});

const calculateSharedCoverage = (participants) => {
  if (!participants.length) {
    return 0;
  }

  const total = participants.reduce(
    (sum, participant) => sum + (Number(participant.coveragePercent) || 0),
    0
  );

  return Math.round(total / participants.length);
};

const listPods = async (req, res) => {
  try {
    const pods = await StudyPod.find({
      $or: [
        { ownerId: req.user._id },
        { "participants.userId": req.user._id },
        { "invites.userId": req.user._id, "invites.status": "pending" },
      ],
    }).sort({ updatedAt: -1 });

    return res.json(pods);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPodById = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    const canAccess =
      pod.ownerId.toString() === req.user._id.toString() ||
      pod.participants.some(
        (participant) => participant.userId.toString() === req.user._id.toString()
      ) ||
      pod.invites.some(
        (invite) =>
          invite.userId.toString() === req.user._id.toString() &&
          invite.status === "pending"
      );

    if (!canAccess) {
      return res.status(401).json({ message: "Not authorized to access this pod" });
    }

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createPod = async (req, res) => {
  try {
    const { name, podType = "silent" } = req.body;

    const pod = await StudyPod.create({
      name: name?.trim() || `${req.user.name}'s Glow Pod`,
      podType,
      ownerId: req.user._id,
      participants: [formatParticipant(req.user, "owner")],
    });

    return res.status(201).json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const inviteToPod = async (req, res) => {
  try {
    const { username } = req.body;
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (pod.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only the pod owner can invite users" });
    }

    const normalizedUsername = username?.trim().toLowerCase();
    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username is required" });
    }

    const invitedUser = await User.findOne({ username: normalizedUsername });
    if (!invitedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyParticipant = pod.participants.some(
      (participant) => participant.userId.toString() === invitedUser._id.toString()
    );

    if (alreadyParticipant) {
      return res.status(400).json({ message: "User is already in this pod" });
    }

    const existingInvite = pod.invites.find(
      (invite) => invite.userId.toString() === invitedUser._id.toString()
    );

    if (existingInvite && existingInvite.status === "pending") {
      return res.status(400).json({ message: "Invite already sent" });
    }

    if (existingInvite) {
      existingInvite.status = "pending";
      existingInvite.respondedAt = null;
    } else {
      pod.invites.push({
        userId: invitedUser._id,
        username: invitedUser.username,
        status: "pending",
      });
    }

    await pod.save();

    await createNotification(
      invitedUser._id,
      "Silent Pod Invite",
      `${req.user.name} invited you to join "${pod.name}".`,
      "info",
      pod._id,
      "study_pod",
      {
        actionPath: "/studysuite",
        actorUsername: req.user.username,
      }
    );

    emitPodUpdate(pod._id, "study_pod_invite", {
      podId: pod._id,
      username: invitedUser.username,
    });

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const respondToInvite = async (req, res) => {
  try {
    const { action } = req.body;
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    const invite = pod.invites.find(
      (entry) =>
        entry.userId.toString() === req.user._id.toString() && entry.status === "pending"
    );

    if (!invite) {
      return res.status(404).json({ message: "Pending invite not found" });
    }

    invite.status = action === "accept" ? "accepted" : "declined";
    invite.respondedAt = new Date();

    if (action === "accept") {
      const alreadyParticipant = pod.participants.some(
        (participant) => participant.userId.toString() === req.user._id.toString()
      );
      if (!alreadyParticipant) {
        pod.participants.push(formatParticipant(req.user));
      }
    }

    await pod.save();

    await createNotification(
      pod.ownerId,
      "Pod Invite Updated",
      `${req.user.name} ${action === "accept" ? "joined" : "declined"} "${pod.name}".`,
      action === "accept" ? "success" : "warning",
      pod._id,
      "study_pod",
      {
        actionPath: "/studysuite",
        actorUsername: req.user.username,
      }
    );

    emitPodUpdate(pod._id, "study_pod_updated", pod);

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const joinPod = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    const alreadyParticipant = pod.participants.some(
      (participant) => participant.userId.toString() === req.user._id.toString()
    );

    if (!alreadyParticipant) {
      pod.participants.push(formatParticipant(req.user));
      await pod.save();
    }

    emitPodUpdate(pod._id, "study_pod_updated", pod);

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    const participant = pod.participants.find(
      (entry) => entry.userId.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(401).json({ message: "Join the pod before updating progress" });
    }

    participant.coveragePercent = Math.max(
      0,
      Math.min(100, Number(req.body.coveragePercent) || 0)
    );
    pod.sharedCoveragePercent = calculateSharedCoverage(pod.participants);

    await pod.save();
    emitPodUpdate(pod._id, "study_pod_updated", pod);

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const startPodSession = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (pod.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only the pod owner can start sessions" });
    }

    const timerMinutes = Number(req.body.timerMinutes) || 25;
    const now = new Date();
    const endsAt = new Date(now.getTime() + timerMinutes * 60 * 1000);

    pod.sessionState = {
      status: "active",
      timerMinutes,
      trackKey: req.body.trackKey || "",
      startedAt: now,
      endsAt,
      debriefEndsAt: null,
    };
    pod.silentModeLocked = true;
    pod.reactions = [];

    await pod.save();
    emitPodUpdate(pod._id, "study_session_state", pod);

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const openDebrief = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (pod.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Only the pod owner can open debrief" });
    }

    const debriefEndsAt = new Date(Date.now() + 5 * 60 * 1000);
    pod.sessionState.status = "debrief";
    pod.sessionState.debriefEndsAt = debriefEndsAt;
    pod.silentModeLocked = false;

    await pod.save();
    emitPodUpdate(pod._id, "study_session_state", pod);

    return res.json(pod);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sendReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (!allowedReactions.includes(emoji)) {
      return res.status(400).json({ message: "Reaction is not allowed" });
    }

    if (!pod.silentModeLocked || pod.sessionState.status !== "active") {
      return res
        .status(400)
        .json({ message: "Reactions are only available during silent study mode" });
    }

    pod.reactions.push({
      userId: req.user._id,
      username: req.user.username,
      emoji,
    });

    await pod.save();
    emitPodUpdate(pod._id, "study_reaction", {
      podId: pod._id,
      emoji,
      username: req.user.username,
      createdAt: new Date(),
    });

    return res.status(201).json(pod.reactions[pod.reactions.length - 1]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sendDebriefText = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (pod.sessionState.status !== "debrief") {
      return res.status(400).json({ message: "Glow Debrief is not open right now" });
    }

    const entry = {
      userId: req.user._id,
      username: req.user.username,
      entryType: "text",
      message: req.body.message?.trim() || "",
    };

    pod.debriefEntries.push(entry);
    await pod.save();
    emitPodUpdate(pod._id, "study_debrief_message", entry);

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sendDebriefVoice = async (req, res) => {
  try {
    const pod = await StudyPod.findById(req.params.id);

    if (!pod) {
      return res.status(404).json({ message: "Study pod not found" });
    }

    if (pod.sessionState.status !== "debrief") {
      return res.status(400).json({ message: "Glow Debrief is not open right now" });
    }

    if (!req.file?.filename) {
      return res.status(400).json({ message: "Voice note file is required" });
    }

    const entry = {
      userId: req.user._id,
      username: req.user.username,
      entryType: "voice",
      voiceUrl: `/uploads/${req.file.filename}`,
      durationSeconds: Number(req.body.durationSeconds) || 0,
    };

    pod.debriefEntries.push(entry);
    await pod.save();
    emitPodUpdate(pod._id, "study_debrief_voice", entry);

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listPods,
  getPodById,
  createPod,
  inviteToPod,
  respondToInvite,
  joinPod,
  updateProgress,
  startPodSession,
  openDebrief,
  sendReaction,
  sendDebriefText,
  sendDebriefVoice,
};
