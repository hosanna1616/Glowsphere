const Challenge = require("../models/Challenge");
const User = require("../models/User");

// Create a new challenge
const createChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      duration,
      rewards,
      requirements,
      category,
    } = req.body;

    const challenge = new Challenge({
      title,
      description,
      createdBy: req.user._id,
      deadline: new Date(deadline),
      duration: parseInt(duration) || 30,
      rewards: rewards || [],
      requirements: requirements || [],
      category: category || "general",
      status: new Date(deadline) > new Date() ? "active" : "upcoming",
    });

    const createdChallenge = await challenge.save();
    res.status(201).json(createdChallenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all challenges
const getChallenges = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }

    const challenges = await Challenge.find(filter)
      .populate("createdBy", "username name")
      .sort({ createdAt: -1 });

    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get challenge by ID
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate(
      "createdBy",
      "username name"
    );

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join a challenge
const joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Check if user already joined
    const alreadyJoined = challenge.participants.some(
      (p) => p.userId.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res
        .status(400)
        .json({ message: "You have already joined this challenge" });
    }

    // Add user to participants
    challenge.participants.push({
      userId: req.user._id,
      progress: 0,
      completed: false,
    });

    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update challenge progress
const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Find user's participation
    const participant = challenge.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res
        .status(400)
        .json({ message: "You have not joined this challenge" });
    }

    // Update progress
    participant.progress = Math.min(Math.max(parseInt(progress) || 0, 0), 100);

    // Mark as completed if progress is 100%
    if (participant.progress >= 100 && !participant.completed) {
      participant.completed = true;
      participant.completedAt = new Date();
    }

    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave a challenge
const leaveChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Remove user from participants
    challenge.participants = challenge.participants.filter(
      (p) => p.userId.toString() !== req.user._id.toString()
    );

    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update challenge (only by creator)
const updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Check if user is creator
    if (challenge.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this challenge" });
    }

    const { title, description, deadline, duration, rewards, requirements, status } = req.body;

    if (title) challenge.title = title;
    if (description) challenge.description = description;
    if (deadline) challenge.deadline = new Date(deadline);
    if (duration) challenge.duration = parseInt(duration);
    if (rewards) challenge.rewards = rewards;
    if (requirements) challenge.requirements = requirements;
    if (status) challenge.status = status;

    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete challenge (only by creator)
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Check if user is creator
    if (challenge.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this challenge" });
    }

    await Challenge.deleteOne({ _id: challenge._id });
    res.json({ message: "Challenge deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createChallenge,
  getChallenges,
  getChallengeById,
  joinChallenge,
  updateProgress,
  leaveChallenge,
  updateChallenge,
  deleteChallenge,
};






