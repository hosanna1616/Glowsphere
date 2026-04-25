const crypto = require("crypto");
const ParallelBloomProfile = require("../models/ParallelBloomProfile");
const { PATH_BY_ID, PATHS } = require("../data/parallelBloomPaths");
const {
  normalizeOnboarding,
  normalizeRediscover,
  rankPaths,
  summarizePath,
  getPathDetail,
  comparePaths,
  dailyDigest,
  nextRotationIndex,
} = require("../utils/parallelBloomEngine");

const FREE_PATH_CAP_RAW = process.env.PARALLEL_BLOOM_FREE_PATHS;
const FREE_PATH_CAP =
  FREE_PATH_CAP_RAW !== undefined && FREE_PATH_CAP_RAW !== ""
    ? parseInt(FREE_PATH_CAP_RAW, 10)
    : null;

async function getOrCreateProfile(userId) {
  let profile = await ParallelBloomProfile.findOne({ userId });
  if (!profile) {
    try {
      profile = await ParallelBloomProfile.create({ userId });
    } catch (err) {
      if (err.code === 11000) {
        profile = await ParallelBloomProfile.findOne({ userId });
      } else {
        throw err;
      }
    }
  }
  return profile;
}

function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function updateStreak(profile) {
  const today = utcDateString();
  const last = profile.dailyState?.lastEngagementDate || "";
  if (last === today) {
    return profile;
  }
  const yesterday = utcDateString(new Date(Date.now() - 86400000));
  let streak = profile.dailyState?.streak || 0;
  if (last === yesterday) {
    streak += 1;
  } else if (last && last !== today) {
    streak = 1;
  } else {
    streak = Math.max(1, streak || 1);
  }
  profile.dailyState = profile.dailyState || {};
  profile.dailyState.lastEngagementDate = today;
  profile.dailyState.streak = streak;
  return profile;
}

const getState = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const catalog = PATHS.map(summarizePath);
    const topMatches = rankPaths(
      profile.onboarding || {},
      profile.rediscover || {},
      profile.exploredPaths || [],
      5,
    );
    res.json({
      profile: profile.toObject(),
      catalog,
      topMatches,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const saveOnboarding = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    profile.onboarding = normalizeOnboarding(req.body || {});
    await profile.save();
    const topMatches = rankPaths(
      profile.onboarding,
      profile.rediscover || {},
      profile.exploredPaths || [],
      5,
    );
    res.json({ profile: profile.toObject(), topMatches });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const saveRediscover = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    profile.rediscover = normalizeRediscover(req.body || {});
    await profile.save();
    const topMatches = rankPaths(
      profile.onboarding || {},
      profile.rediscover,
      profile.exploredPaths || [],
      5,
    );
    res.json({ profile: profile.toObject(), topMatches });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const getPath = async (req, res) => {
  try {
    const detail = getPathDetail(req.params.pathId);
    if (!detail) {
      return res.status(404).json({ message: "Path not found" });
    }
    res.json(detail);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const startExplore = async (req, res) => {
  try {
    const pathId = req.params.pathId;
    if (!PATH_BY_ID[pathId]) {
      return res.status(404).json({ message: "Path not found" });
    }

    const profile = await getOrCreateProfile(req.user._id);

    if (
      FREE_PATH_CAP != null &&
      !Number.isNaN(FREE_PATH_CAP) &&
      !profile.premium &&
      profile.explorationCount >= FREE_PATH_CAP
    ) {
      return res.status(403).json({
        message:
          "Exploration limit reached. Premium unlocks unlimited parallel futures.",
        code: "PARALLEL_BLOOM_LIMIT",
      });
    }

    const existing = profile.exploredPaths.find((e) => e.pathId === pathId);
    if (!existing) {
      profile.exploredPaths.push({ pathId, exploredAt: new Date() });
      profile.explorationCount = (profile.explorationCount || 0) + 1;
    }
    await profile.save();

    const detail = getPathDetail(pathId);
    res.json({ profile: profile.toObject(), path: detail });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const saveReflection = async (req, res) => {
  try {
    const { pathId, reflection } = req.body || {};
    if (!pathId || !PATH_BY_ID[pathId]) {
      return res.status(400).json({ message: "Valid pathId required" });
    }
    const profile = await getOrCreateProfile(req.user._id);
    let entry = profile.exploredPaths.find((e) => e.pathId === pathId);
    if (!entry) {
      profile.exploredPaths.push({
        pathId,
        exploredAt: new Date(),
        reflection: reflection || {},
      });
    } else {
      entry.reflection = { ...entry.reflection, ...reflection };
      entry.exploredAt = entry.exploredAt || new Date();
    }
    await profile.save();
    const topMatches = rankPaths(
      profile.onboarding || {},
      profile.rediscover || {},
      profile.exploredPaths || [],
      5,
    );
    res.json({ profile: profile.toObject(), topMatches });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const postCompare = async (req, res) => {
  try {
    const ids = req.body?.pathIds;
    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ message: "Provide 2–3 pathIds in pathIds array." });
    }
    const clean = [...new Set(ids)].slice(0, 3);
    for (const id of clean) {
      if (!PATH_BY_ID[id]) {
        return res.status(400).json({ message: `Unknown path: ${id}` });
      }
    }
    const profile = await getOrCreateProfile(req.user._id);
    const compare = comparePaths(clean, profile);
    res.json({ compare });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const getDaily = async (req, res) => {
  try {
    const profile = await getOrCreateProfile(req.user._id);
    const today = utcDateString();
    const last = profile.dailyState?.lastEngagementDate || "";
    const firstVisitToday = last !== today;
    if (firstVisitToday) {
      updateStreak(profile);
      profile.dailyState.rotationIndex = nextRotationIndex(profile.dailyState.rotationIndex || 0);
    }
    const digest = dailyDigest(profile);
    await profile.save();
    res.json({ daily: digest, profile: profile.toObject() });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const addCapsule = async (req, res) => {
  try {
    const { pathId, title, note } = req.body || {};
    if (!pathId || !PATH_BY_ID[pathId]) {
      return res.status(400).json({ message: "Valid pathId required" });
    }
    const detail = getPathDetail(pathId);
    const profile = await getOrCreateProfile(req.user._id);
    const capsule = {
      capsuleId: crypto.randomUUID(),
      pathId,
      title: title || detail.title,
      note: note || "",
      createdAt: new Date(),
    };
    profile.capsules.push(capsule);
    await profile.save();
    res.status(201).json({ capsule, profile: profile.toObject() });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const deleteCapsule = async (req, res) => {
  try {
    const { capsuleId } = req.params;
    const profile = await getOrCreateProfile(req.user._id);
    const before = profile.capsules.length;
    profile.capsules = profile.capsules.filter((c) => c.capsuleId !== capsuleId);
    if (profile.capsules.length === before) {
      return res.status(404).json({ message: "Capsule not found" });
    }
    await profile.save();
    res.json({ profile: profile.toObject() });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

module.exports = {
  getState,
  saveOnboarding,
  saveRediscover,
  getPath,
  startExplore,
  saveReflection,
  postCompare,
  getDaily,
  addCapsule,
  deleteCapsule,
};
