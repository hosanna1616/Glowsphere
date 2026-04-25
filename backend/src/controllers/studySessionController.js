const StudySession = require("../models/StudySession");
const StudyMaterial = require("../models/StudyMaterial");

const normalizeCoverage = (value) => {
  const numberValue = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

const startSession = async (req, res) => {
  try {
    const {
      studyMaterialId = null,
      podId = null,
      timerPresetMinutes = 25,
      actualDurationMinutes = 25,
      trackKey = "",
      coverageAtStart = 0,
      mode = "focus",
    } = req.body;

    await StudySession.updateMany(
      { userId: req.user._id, status: "active" },
      { status: "completed", endedAt: new Date() }
    );

    const session = await StudySession.create({
      userId: req.user._id,
      studyMaterialId,
      podId,
      timerPresetMinutes,
      actualDurationMinutes,
      trackKey,
      coverageAtStart: normalizeCoverage(coverageAtStart),
      mode,
      status: "active",
      startedAt: new Date(),
    });

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const completeSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this study session" });
    }

    session.status = req.body.status || "completed";
    session.coverageAtEnd = normalizeCoverage(req.body.coverageAtEnd);
    session.endedAt = new Date();
    await session.save();

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      userId: req.user._id,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const saveReadingProgress = async (req, res) => {
  try {
    const {
      lastPageRead = 1,
      pagesVisited = [],
      pagesHighlighted = [],
      coveragePercent = 0,
    } = req.body;

    const studyMaterial = await StudyMaterial.findById(req.params.id);

    if (!studyMaterial) {
      return res.status(404).json({ message: "Study material not found" });
    }

    if (studyMaterial.userId.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this study material" });
    }

    const existingProgress = studyMaterial.readingProgress.find(
      (entry) => entry.userId.toString() === req.user._id.toString()
    );

    const uniqueVisited = [...new Set((pagesVisited || []).map(Number).filter(Boolean))];
    const uniqueHighlighted = [
      ...new Set((pagesHighlighted || []).map(Number).filter(Boolean)),
    ];

    if (existingProgress) {
      existingProgress.lastPageRead = Number(lastPageRead) || 1;
      existingProgress.pagesVisited = uniqueVisited;
      existingProgress.pagesHighlighted = uniqueHighlighted;
      existingProgress.coveragePercent = normalizeCoverage(coveragePercent);
      existingProgress.updatedAt = new Date();
    } else {
      studyMaterial.readingProgress.push({
        userId: req.user._id,
        lastPageRead: Number(lastPageRead) || 1,
        pagesVisited: uniqueVisited,
        pagesHighlighted: uniqueHighlighted,
        coveragePercent: normalizeCoverage(coveragePercent),
        updatedAt: new Date(),
      });
    }

    await studyMaterial.save();

    return res.json(
      studyMaterial.readingProgress.find(
        (entry) => entry.userId.toString() === req.user._id.toString()
      )
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startSession,
  completeSession,
  getMySessions,
  getActiveSession,
  saveReadingProgress,
};
