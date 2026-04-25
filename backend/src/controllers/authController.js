const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const parseMaybeJson = (value, fallback = null) => {
  if (typeof value !== "string") {
    return value ?? fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

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
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database connection not ready. Please try again in a moment.",
      });
    }

    const { name, username, email, password, lastPeriod, cycleLength } =
      req.body;

    // Validate input
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Name, username, email, and password are required",
      });
    }

    // Normalize email and username to lowercase (matching schema)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
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

    // Create user with normalized email and username
    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
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
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        lastPeriod: user.lastPeriod,
        cycleLength: user.cycleLength,
        onboardingComplete: user.onboardingComplete,
        glowPoints: user.glowPoints,
        bloomGarden: user.bloomGarden,
        fireSpirits: user.fireSpirits,
        emberCrownUntil: user.emberCrownUntil,
        role: user.role,
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
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database connection not ready. Please try again in a moment.",
      });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Normalize email to lowercase (matching schema)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if onboarding is complete
    if (!user.onboardingComplete) {
      return res.status(401).json({
        message: "Please complete the onboarding process",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      lastPeriod: user.lastPeriod,
      cycleLength: user.cycleLength,
      onboardingComplete: user.onboardingComplete,
      glowPoints: user.glowPoints,
      bloomGarden: user.bloomGarden,
      fireSpirits: user.fireSpirits,
      emberCrownUntil: user.emberCrownUntil,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
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
        glowPoints: user.glowPoints,
        bloomGarden: user.bloomGarden,
        fireSpirits: user.fireSpirits,
        emberCrownUntil: user.emberCrownUntil,
        role: user.role,
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
      const nextName = req.body.name?.trim() || user.name;
      const nextUsername = req.body.username?.trim().toLowerCase() || user.username;
      const nextEmail = req.body.email?.trim().toLowerCase() || user.email;

      const duplicateUser = await User.findOne({
        _id: { $ne: user._id },
        $or: [{ username: nextUsername }, { email: nextEmail }],
      });

      if (duplicateUser) {
        return res.status(400).json({
          message: "This username or email is already taken",
        });
      }

      user.name = nextName;
      user.username = nextUsername;
      user.email = nextEmail;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.location =
        req.body.location !== undefined ? req.body.location : user.location;
      
      if (req.file) {
        if (req.file.secure_url) {
          user.avatar = req.file.secure_url;
        } else if (req.file.filename) {
          user.avatar = `/uploads/${req.file.filename}`;
        } else if (req.file.path) {
          const normalizedPath = req.file.path.replace(/\\/g, "/");
          const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
          user.avatar =
            uploadsIndex !== -1
              ? normalizedPath.slice(uploadsIndex)
              : user.avatar;
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
      if (req.body.glowPoints !== undefined) {
        const parsedPoints = Number(req.body.glowPoints);
        user.glowPoints = Number.isFinite(parsedPoints)
          ? parsedPoints
          : user.glowPoints;
      }
      const parsedBloomGarden = parseMaybeJson(req.body.bloomGarden);
      if (Array.isArray(parsedBloomGarden)) {
        user.bloomGarden = parsedBloomGarden;
      }
      const parsedFireSpirits = parseMaybeJson(req.body.fireSpirits);
      if (Array.isArray(parsedFireSpirits)) {
        user.fireSpirits = parsedFireSpirits;
      }
      if (req.body.emberCrownUntil !== undefined) {
        user.emberCrownUntil = req.body.emberCrownUntil
          ? new Date(req.body.emberCrownUntil)
          : null;
      }

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
        glowPoints: updatedUser.glowPoints,
        bloomGarden: updatedUser.bloomGarden,
        fireSpirits: updatedUser.fireSpirits,
        emberCrownUntil: updatedUser.emberCrownUntil,
        role: updatedUser.role,
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

const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "_id username name avatar")
      .select("friends");
    res.json(user?.friends || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addFriend = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }
    const normalized = username.trim().toLowerCase();
    const friend = await User.findOne({ username: normalized });
    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }
    if (friend._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself as friend" });
    }

    const me = await User.findById(req.user._id);
    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }
    const alreadyFriends = me.friends.some(
      (friendId) => friendId.toString() === friend._id.toString()
    );
    if (!alreadyFriends) {
      me.friends.push(friend._id);
      await me.save();
    }

    const reciprocal = await User.findById(friend._id);
    const reciprocalExists = reciprocal.friends.some(
      (friendId) => friendId.toString() === me._id.toString()
    );
    if (!reciprocalExists) {
      reciprocal.friends.push(me._id);
      await reciprocal.save();
    }

    res.json({
      message: `@${friend.username} added as friend`,
      friend: {
        _id: friend._id,
        username: friend.username,
        name: friend.name,
        avatar: friend.avatar,
      },
    });
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
  getFriends,
  addFriend,
};
