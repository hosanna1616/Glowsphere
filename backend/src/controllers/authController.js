const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "glowsphere_secret_key",
    {
      expiresIn: "30d",
    }
  );
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, lastPeriod, cycleLength } =
      req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email or username",
      });
    }

    // Validate period tracking data
    if (!lastPeriod || !cycleLength) {
      return res.status(400).json({
        message: "Period tracking information is required for registration",
      });
    }

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password,
      lastPeriod: new Date(lastPeriod),
      cycleLength: parseInt(cycleLength),
      onboardingComplete: true,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        lastPeriod: user.lastPeriod,
        cycleLength: user.cycleLength,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticate user
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Check if onboarding is complete
      if (!user.onboardingComplete) {
        return res.status(401).json({
          message: "Please complete the onboarding process",
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        lastPeriod: user.lastPeriod,
        cycleLength: user.cycleLength,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
        lastPeriod: user.lastPeriod,
        cycleLength: user.cycleLength,
        interests: user.interests,
        goals: user.goals,
        challenges: user.challenges,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio || user.bio;
      user.location = req.body.location || user.location;
      
      // Handle avatar upload if file is present
      if (req.file) {
        const { uploadToCloudinary } = require("../utils/upload");
        try {
          const result = await uploadToCloudinary(req.file);
          user.avatar = result.secure_url;
        } catch (uploadError) {
          // Fallback to local file URL if Cloudinary fails
          user.avatar = `/uploads/${req.file.filename}`;
        }
      } else if (req.body.avatar) {
        // If avatar is provided as URL string
        user.avatar = req.body.avatar;
      }
      
      user.lastPeriod = req.body.lastPeriod
        ? new Date(req.body.lastPeriod)
        : user.lastPeriod;
      user.cycleLength = req.body.cycleLength
        ? parseInt(req.body.cycleLength)
        : user.cycleLength;
      user.interests = req.body.interests || user.interests;
      user.goals = req.body.goals || user.goals;
      user.challenges = req.body.challenges || user.challenges;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        location: updatedUser.location,
        avatar: updatedUser.avatar,
        lastPeriod: updatedUser.lastPeriod,
        cycleLength: updatedUser.cycleLength,
        interests: updatedUser.interests,
        goals: updatedUser.goals,
        challenges: updatedUser.challenges,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search users by username
const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 2) {
      return res.status(400).json({
        message: "Username must be at least 2 characters",
      });
    }

    const users = await User.find({
      username: { $regex: username, $options: "i" },
      isActive: true,
    })
      .select("_id username name avatar")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  searchUsers,
};
