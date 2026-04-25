const SoulSuitcase = require("../models/SoulSuitcase");
const SoulMatch = require("../models/SoulMatch");
const LegacyLetter = require("../models/LegacyLetter");
const Quest = require("../models/Quest");
const Challenge = require("../models/Challenge");
const User = require("../models/User");

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const sanitizeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildAlias = (userId) => `Soul ${String(userId).slice(-4).toUpperCase()}`;

const getParticipant = (match, userId) =>
  match.participants.find(
    (participant) => participant.userId.toString() === userId.toString()
  );

const getOtherParticipant = (match, userId) =>
  match.participants.find(
    (participant) => participant.userId.toString() !== userId.toString()
  );

const refreshMatchStatus = async (match) => {
  if (!match) {
    return null;
  }

  const now = new Date();
  const hasExpired = match.expiresAt && match.expiresAt.getTime() <= now.getTime();
  const allRevealYes =
    match.revealDecisions.length === 2 &&
    match.revealDecisions.every((decision) => decision.decision === "yes");

  if (hasExpired && !allRevealYes && match.status !== "closed") {
    match.status = "closed";
    match.closedReason = "24-hour window ended";
    await match.save();
  } else if (allRevealYes && match.status !== "revealed") {
    match.status = "revealed";
    await match.save();
  }

  return match;
};

const getMilestoneProgress = async (userId) => {
  const [user, completedQuests, completedChallenges] = await Promise.all([
    User.findById(userId).select("createdAt"),
    Quest.countDocuments({
      progress: {
        $elemMatch: {
          userId,
          completed: true,
        },
      },
    }),
    Challenge.countDocuments({
      participants: {
        $elemMatch: {
          userId,
          completed: true,
        },
      },
    }),
  ]);

  const daysSinceJoined = user?.createdAt
    ? Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / DAY_MS))
    : 0;

  return {
    days_since_joined: daysSinceJoined,
    quests_completed: completedQuests,
    challenges_completed: completedChallenges,
  };
};

const refreshLetters = async (userId) => {
  const progress = await getMilestoneProgress(userId);
  const lockedLetters = await LegacyLetter.find({
    userId,
    unlockedAt: null,
  });

  const now = new Date();
  const updates = lockedLetters.map(async (letter) => {
    if ((progress[letter.milestoneType] || 0) >= letter.milestoneTarget) {
      letter.unlockedAt = now;
      letter.deliveredAt = now;
      return letter.save();
    }
    return letter;
  });

  await Promise.all(updates);
  return progress;
};

const formatLetter = (letter, progress) => ({
  _id: letter._id,
  recipientType: letter.recipientType,
  title: letter.title,
  body: letter.body,
  milestoneType: letter.milestoneType,
  milestoneTarget: letter.milestoneTarget,
  progressValue: progress[letter.milestoneType] || 0,
  isUnlocked: Boolean(letter.unlockedAt),
  unlockedAt: letter.unlockedAt,
  deliveredAt: letter.deliveredAt,
  createdAt: letter.createdAt,
});

const formatSuitcaseItem = (item) => ({
  _id: item._id,
  type: item.type,
  title: item.title,
  caption: item.caption,
  mediaUrl: item.mediaUrl,
  colorMood: item.colorMood,
  tags: item.tags || [],
  createdAt: item.createdAt,
});

const formatMatchForUser = async (match, userId) => {
  const hydratedMatch = await refreshMatchStatus(match);
  if (!hydratedMatch) {
    return null;
  }

  const me = getParticipant(hydratedMatch, userId);
  const other = getOtherParticipant(hydratedMatch, userId);
  if (!me || !other) {
    return null;
  }

  const [otherUser, otherSuitcase] = await Promise.all([
    User.findById(other.userId).select("username name avatar"),
    SoulSuitcase.findOne({ userId: other.userId }).select(
      "styleTags vibeWords destinationDreams energyNote items"
    ),
  ]);

  const myDecision = hydratedMatch.revealDecisions.find(
    (decision) => decision.userId.toString() === userId.toString()
  );
  const otherDecision = hydratedMatch.revealDecisions.find(
    (decision) => decision.userId.toString() !== userId.toString()
  );
  const revealed = hydratedMatch.status === "revealed";

  return {
    _id: hydratedMatch._id,
    status: hydratedMatch.status,
    startedAt: hydratedMatch.startedAt,
    expiresAt: hydratedMatch.expiresAt,
    timeLeftMs: Math.max(0, new Date(hydratedMatch.expiresAt).getTime() - Date.now()),
    sharedSignals: hydratedMatch.sharedSignals || [],
    score: hydratedMatch.score || 0,
    me: {
      alias: me.alias,
      revealDecision: myDecision?.decision || "pending",
    },
    soulSister: {
      alias: other.alias,
      username: revealed ? otherUser?.username || "" : "",
      name: revealed ? otherUser?.name || "" : "",
      avatar: revealed ? otherUser?.avatar || "" : "",
      styleTags: otherSuitcase?.styleTags || [],
      vibeWords: otherSuitcase?.vibeWords || [],
      destinationDreams: otherSuitcase?.destinationDreams || [],
      energyNote: otherSuitcase?.energyNote || "",
      items: (otherSuitcase?.items || []).map(formatSuitcaseItem),
    },
    reveal: {
      mine: myDecision?.decision || "pending",
      theirs: otherDecision?.decision || "pending",
      isMutual: revealed,
    },
    voiceNotes: hydratedMatch.voiceNotes.map((note) => ({
      _id: note._id,
      alias: note.alias,
      text: note.text,
      isMine: note.authorId.toString() === userId.toString(),
      createdAt: note.createdAt,
    })),
    jointMemory: hydratedMatch.jointMemory || {
      title: "",
      body: "",
      destinations: [],
      updatedAt: null,
    },
    privacyNotice:
      "Anonymous soul matches close after 24 hours unless both girls choose reveal. You can delete voice notes, letters, and suitcase items anytime.",
  };
};

const ensureSuitcase = async (user) => {
  let suitcase = await SoulSuitcase.findOne({ userId: user._id });
  if (!suitcase) {
    suitcase = await SoulSuitcase.create({
      userId: user._id,
      vibeWords: [],
      styleTags: [],
      destinationDreams: [],
      energyNote: "",
      items: [],
    });
  }
  if (!suitcase.weeklyMatcher) {
    suitcase.weeklyMatcher = { lastRequestedAt: null };
    await suitcase.save();
  }
  return suitcase;
};

const getActiveMatch = async (userId) => {
  const match = await SoulMatch.findOne({
    "participants.userId": userId,
    status: { $in: ["active", "revealed"] },
  }).sort({ createdAt: -1 });

  return refreshMatchStatus(match);
};

const getOverview = async (req, res) => {
  try {
    const suitcase = await ensureSuitcase(req.user);
    const progress = await refreshLetters(req.user._id);
    const [letters, currentMatch] = await Promise.all([
      LegacyLetter.find({ userId: req.user._id }).sort({ createdAt: -1 }),
      getActiveMatch(req.user._id),
    ]);

    const cooldownEndsAt = suitcase.weeklyMatcher.lastRequestedAt
      ? new Date(suitcase.weeklyMatcher.lastRequestedAt.getTime() + WEEK_MS)
      : null;

    res.json({
      suitcase: {
        _id: suitcase._id,
        vibeWords: suitcase.vibeWords,
        styleTags: suitcase.styleTags,
        destinationDreams: suitcase.destinationDreams,
        energyNote: suitcase.energyNote,
        privacyMode: suitcase.privacyMode,
        items: suitcase.items.map(formatSuitcaseItem),
        matcher: {
          lastRequestedAt: suitcase.weeklyMatcher.lastRequestedAt,
          cooldownEndsAt,
          canFindMatch: !cooldownEndsAt || cooldownEndsAt.getTime() <= Date.now(),
        },
      },
      currentMatch: currentMatch
        ? await formatMatchForUser(currentMatch, req.user._id)
        : null,
      legacyLetters: letters.map((letter) => formatLetter(letter, progress)),
      milestoneProgress: progress,
      privacyNotices: [
        "Soul Suitcase matching is anonymous until both girls choose reveal.",
        "You can delete suitcase items, voice notes, and letters at any time.",
        "Legacy Letters stay private and unlock only for you when milestones are reached.",
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSuitcaseProfile = async (req, res) => {
  try {
    const suitcase = await ensureSuitcase(req.user);
    suitcase.vibeWords = sanitizeList(req.body.vibeWords);
    suitcase.styleTags = sanitizeList(req.body.styleTags);
    suitcase.destinationDreams = sanitizeList(req.body.destinationDreams);
    suitcase.energyNote = String(req.body.energyNote || "").trim().slice(0, 240);
    suitcase.privacyMode = req.body.privacyMode || suitcase.privacyMode;

    await suitcase.save();
    res.json({
      message: "Soul Suitcase updated",
      suitcase: {
        vibeWords: suitcase.vibeWords,
        styleTags: suitcase.styleTags,
        destinationDreams: suitcase.destinationDreams,
        energyNote: suitcase.energyNote,
        privacyMode: suitcase.privacyMode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addSuitcaseItem = async (req, res) => {
  try {
    const { type, title, caption, mediaUrl, colorMood, tags } = req.body;
    if (!type || !title) {
      return res.status(400).json({ message: "Type and title are required" });
    }

    const suitcase = await ensureSuitcase(req.user);
    suitcase.items.unshift({
      type,
      title: String(title).trim(),
      caption: String(caption || "").trim(),
      mediaUrl: String(mediaUrl || "").trim(),
      colorMood: String(colorMood || "").trim(),
      tags: sanitizeList(tags),
    });
    await suitcase.save();

    res.status(201).json({
      message: "Added to your Soul Suitcase",
      item: formatSuitcaseItem(suitcase.items[0]),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSuitcaseItem = async (req, res) => {
  try {
    const suitcase = await ensureSuitcase(req.user);
    const item = suitcase.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Suitcase item not found" });
    }

    item.deleteOne();
    await suitcase.save();
    res.json({ message: "Suitcase item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const findSoulSister = async (req, res) => {
  try {
    const suitcase = await ensureSuitcase(req.user);
    const existingMatch = await getActiveMatch(req.user._id);
    if (existingMatch) {
      return res.status(400).json({ message: "You already have an active soul match" });
    }

    if (
      suitcase.weeklyMatcher.lastRequestedAt &&
      suitcase.weeklyMatcher.lastRequestedAt.getTime() + WEEK_MS > Date.now()
    ) {
      const nextTryAt = new Date(
        suitcase.weeklyMatcher.lastRequestedAt.getTime() + WEEK_MS
      );
      return res.status(400).json({
        message: `Your weekly Soul Sister match is on cooldown until ${nextTryAt.toLocaleString()}`,
      });
    }

    const candidates = await SoulSuitcase.find({
      userId: { $ne: req.user._id },
    }).sort({ updatedAt: -1 });

    let bestCandidate = null;
    let bestScore = -1;
    let bestSignals = [];

    for (const candidate of candidates) {
      const candidateActiveMatch = await getActiveMatch(candidate.userId);
      if (candidateActiveMatch) {
        continue;
      }

      const styleOverlap = suitcase.styleTags.filter((tag) =>
        candidate.styleTags.includes(tag)
      );
      const vibeOverlap = suitcase.vibeWords.filter((word) =>
        candidate.vibeWords.includes(word)
      );
      const destinationOverlap = suitcase.destinationDreams.filter((place) =>
        candidate.destinationDreams.includes(place)
      );

      const score =
        styleOverlap.length * 4 + vibeOverlap.length * 3 + destinationOverlap.length * 2;
      const signals = [...styleOverlap, ...vibeOverlap, ...destinationOverlap].slice(0, 6);

      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
        bestSignals = signals;
      }
    }

    if (!bestCandidate) {
      return res.status(404).json({
        message: "No Soul Sister is available yet. Ask another girl to fill her Soul Suitcase first.",
      });
    }

    suitcase.weeklyMatcher.lastRequestedAt = new Date();
    await suitcase.save();

    const match = await SoulMatch.create({
      participants: [
        {
          userId: req.user._id,
          alias: buildAlias(req.user._id),
        },
        {
          userId: bestCandidate.userId,
          alias: buildAlias(bestCandidate.userId),
        },
      ],
      score: Math.max(bestScore, 1),
      sharedSignals: bestSignals,
      expiresAt: new Date(Date.now() + DAY_MS),
      revealDecisions: [
        { userId: req.user._id, decision: "pending" },
        { userId: bestCandidate.userId, decision: "pending" },
      ],
    });

    res.status(201).json({
      message: "Your Soul Sister has been found for the next 24 hours",
      match: await formatMatchForUser(match, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addVoiceNote = async (req, res) => {
  try {
    const match = await SoulMatch.findById(req.params.matchId);
    const activeMatch = await refreshMatchStatus(match);

    if (!activeMatch) {
      return res.status(404).json({ message: "Soul match not found" });
    }
    if (activeMatch.status === "closed") {
      return res.status(400).json({ message: "This soul connection has already closed" });
    }

    const participant = getParticipant(activeMatch, req.user._id);
    if (!participant) {
      return res.status(403).json({ message: "Not part of this soul match" });
    }

    const text = String(req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Voice note text is required" });
    }

    activeMatch.voiceNotes.push({
      authorId: req.user._id,
      alias: participant.alias,
      text: text.slice(0, 280),
    });
    await activeMatch.save();

    res.status(201).json({
      message: "Secret voice note sent",
      match: await formatMatchForUser(activeMatch, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVoiceNote = async (req, res) => {
  try {
    const match = await SoulMatch.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ message: "Soul match not found" });
    }

    const note = match.voiceNotes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: "Voice note not found" });
    }
    if (note.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own voice notes" });
    }

    note.deleteOne();
    await match.save();
    res.json({ message: "Voice note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveJointMemory = async (req, res) => {
  try {
    const match = await SoulMatch.findById(req.params.matchId);
    const activeMatch = await refreshMatchStatus(match);

    if (!activeMatch) {
      return res.status(404).json({ message: "Soul match not found" });
    }
    if (!getParticipant(activeMatch, req.user._id)) {
      return res.status(403).json({ message: "Not part of this soul match" });
    }
    if (activeMatch.status === "closed") {
      return res.status(400).json({ message: "This soul connection has already closed" });
    }

    activeMatch.jointMemory = {
      title: String(req.body.title || "").trim().slice(0, 100),
      body: String(req.body.body || "").trim().slice(0, 1200),
      destinations: sanitizeList(req.body.destinations).slice(0, 6),
      updatedAt: new Date(),
    };

    await activeMatch.save();
    res.json({
      message: "Joint memory saved",
      match: await formatMatchForUser(activeMatch, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRevealDecision = async (req, res) => {
  try {
    const match = await SoulMatch.findById(req.params.matchId);
    const activeMatch = await refreshMatchStatus(match);

    if (!activeMatch) {
      return res.status(404).json({ message: "Soul match not found" });
    }

    const decision = req.body.decision;
    if (!["yes", "no"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be yes or no" });
    }

    const myDecision = activeMatch.revealDecisions.find(
      (entry) => entry.userId.toString() === req.user._id.toString()
    );
    if (!myDecision) {
      return res.status(403).json({ message: "Not part of this soul match" });
    }

    myDecision.decision = decision;
    myDecision.decidedAt = new Date();
    await activeMatch.save();
    await refreshMatchStatus(activeMatch);

    res.json({
      message:
        decision === "yes"
          ? "Reveal choice saved"
          : "You chose to keep this connection anonymous",
      match: await formatMatchForUser(activeMatch, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const closeMatch = async (req, res) => {
  try {
    const match = await SoulMatch.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ message: "Soul match not found" });
    }
    if (!getParticipant(match, req.user._id)) {
      return res.status(403).json({ message: "Not part of this soul match" });
    }

    match.status = "closed";
    match.closedReason = "Deleted by participant";
    await match.save();
    res.json({ message: "Soul connection closed and hidden from future use" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLegacyLetter = async (req, res) => {
  try {
    const { recipientType, title, body, milestoneType, milestoneTarget } = req.body;
    if (!recipientType || !title || !body || !milestoneType || !milestoneTarget) {
      return res.status(400).json({ message: "All letter fields are required" });
    }

    const letter = await LegacyLetter.create({
      userId: req.user._id,
      recipientType,
      title: String(title).trim(),
      body: String(body).trim(),
      milestoneType,
      milestoneTarget: parseInt(milestoneTarget, 10),
    });

    const progress = await refreshLetters(req.user._id);
    const savedLetter = await LegacyLetter.findById(letter._id);

    res.status(201).json({
      message: "Legacy Letter saved privately",
      letter: formatLetter(savedLetter, progress),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLegacyLetter = async (req, res) => {
  try {
    const letter = await LegacyLetter.findOne({
      _id: req.params.letterId,
      userId: req.user._id,
    });
    if (!letter) {
      return res.status(404).json({ message: "Legacy Letter not found" });
    }

    await LegacyLetter.deleteOne({ _id: letter._id });
    res.json({ message: "Legacy Letter deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOverview,
  updateSuitcaseProfile,
  addSuitcaseItem,
  deleteSuitcaseItem,
  findSoulSister,
  addVoiceNote,
  deleteVoiceNote,
  saveJointMemory,
  updateRevealDecision,
  closeMatch,
  createLegacyLetter,
  deleteLegacyLetter,
};
