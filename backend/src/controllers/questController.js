const Quest = require("../models/Quest");
const User = require("../models/User");

// Create a new quest
const createQuest = async (req, res) => {
  try {
    const { title, description, difficulty, xp, tags, deadline } = req.body;

    const quest = new Quest({
      title,
      description,
      difficulty,
      xp,
      tags,
      deadline: new Date(deadline),
      createdBy: req.user._id,
    });

    const createdQuest = await quest.save();
    res.status(201).json(createdQuest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all quests
const getQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ status: "published" }).sort({
      createdAt: -1,
    });

    res.json(quests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quest by ID
const getQuestById = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);

    if (quest && quest.status === "published") {
      res.json(quest);
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quest
const updateQuest = async (req, res) => {
  try {
    const { title, description, difficulty, xp, tags, deadline, status } =
      req.body;

    const quest = await Quest.findById(req.params.id);

    if (quest) {
      // Check if user is owner of the quest
      if (quest.createdBy.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to update this quest" });
      }

      quest.title = title || quest.title;
      quest.description = description || quest.description;
      quest.difficulty = difficulty || quest.difficulty;
      quest.xp = xp || quest.xp;
      quest.tags = tags || quest.tags;
      quest.deadline = deadline ? new Date(deadline) : quest.deadline;
      quest.status = status || quest.status;

      const updatedQuest = await quest.save();
      res.json(updatedQuest);
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete quest
const deleteQuest = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);

    if (quest) {
      // Check if user is owner of the quest
      if (quest.createdBy.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this quest" });
      }

      await quest.remove();
      res.json({ message: "Quest removed" });
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quest progress
const updateProgress = async (req, res) => {
  try {
    const { percentage } = req.body;

    const quest = await Quest.findById(req.params.id);

    if (quest) {
      // Find existing progress entry or create new one
      const progressIndex = quest.progress.findIndex(
        (p) => p.userId.toString() === req.user._id.toString()
      );

      if (progressIndex > -1) {
        // Update existing progress
        quest.progress[progressIndex].percentage = percentage;
        quest.progress[progressIndex].completed = percentage >= 100;
        quest.progress[progressIndex].updatedAt = Date.now();
      } else {
        // Add new progress entry
        quest.progress.push({
          userId: req.user._id,
          username: req.user.username,
          percentage,
          completed: percentage >= 100,
        });
      }

      const updatedQuest = await quest.save();

      // Return the updated progress entry
      const userProgress = updatedQuest.progress.find(
        (p) => p.userId.toString() === req.user._id.toString()
      );

      res.json(userProgress);
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add supporter to quest
const addSupporter = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);

    if (quest) {
      // Check if user is already supporting
      const alreadySupporting = quest.supporters.some(
        (supporter) => supporter.userId.toString() === req.user._id.toString()
      );

      if (alreadySupporting) {
        return res
          .status(400)
          .json({ message: "User is already supporting this quest" });
      }

      // Add supporter
      quest.supporters.push({
        userId: req.user._id,
        username: req.user.username,
      });

      const updatedQuest = await quest.save();
      res.json({
        supporters: updatedQuest.supporters,
        supporterCount: updatedQuest.supporters.length,
      });
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove supporter from quest
const removeSupporter = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);

    if (quest) {
      // Remove supporter
      quest.supporters = quest.supporters.filter(
        (supporter) => supporter.userId.toString() !== req.user._id.toString()
      );

      const updatedQuest = await quest.save();
      res.json({
        supporters: updatedQuest.supporters,
        supporterCount: updatedQuest.supporters.length,
      });
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to quest
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const quest = await Quest.findById(req.params.id);

    if (quest) {
      const comment = {
        userId: req.user._id,
        username: req.user.username,
        text,
      };

      quest.comments.push(comment);
      const updatedQuest = await quest.save();

      res
        .status(201)
        .json(updatedQuest.comments[updatedQuest.comments.length - 1]);
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment from quest
const deleteComment = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.questId);

    if (quest) {
      const comment = quest.comments.find(
        (comment) => comment._id.toString() === req.params.commentId
      );

      if (comment) {
        // Check if user is owner of the comment or quest
        if (
          comment.userId.toString() !== req.user._id.toString() &&
          quest.createdBy.toString() !== req.user._id.toString()
        ) {
          return res
            .status(401)
            .json({ message: "Not authorized to delete this comment" });
        }

        quest.comments = quest.comments.filter(
          (comment) => comment._id.toString() !== req.params.commentId
        );

        const updatedQuest = await quest.save();
        res.json({ message: "Comment removed" });
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } else {
      res.status(404).json({ message: "Quest not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuest,
  getQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  updateProgress,
  addSupporter,
  removeSupporter,
  addComment,
  deleteComment,
};
