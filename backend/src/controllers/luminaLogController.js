const LuminaLog = require("../models/LuminaLog");

const ALLOWED_MODES = new Set([
  "release",
  "glow_up",
  "future_self",
  "gratitude_glow",
]);

const ALLOWED_THEMES = new Set([
  "rose_gold",
  "moonlit",
  "fairy_lights",
  "sunset_blush",
]);

const isSunday = (dateValue) => {
  const date = new Date(dateValue);
  return date.getDay() === 0;
};

const getLogs = async (req, res) => {
  try {
    const logs = await LuminaLog.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const hasSundayLog = logs.some((log) => isSunday(log.createdAt));
    res.json({
      logs,
      weeklyReel: hasSundayLog
        ? {
            status: "ready",
            message: "Weekly Growth Reel Ready",
          }
        : {
            status: "pending",
            message: "Record on Sunday to unlock your weekly glow reel.",
          },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLog = async (req, res) => {
  try {
    const { mode, theme, quote, videoUrl, durationSeconds, echoReply } = req.body;

    if (!ALLOWED_MODES.has(mode)) {
      return res.status(400).json({ message: "Invalid Lumina mode" });
    }
    if (!ALLOWED_THEMES.has(theme)) {
      return res.status(400).json({ message: "Invalid Lumina theme" });
    }
    if (!quote || !videoUrl || !echoReply) {
      return res.status(400).json({ message: "Missing required Lumina log fields" });
    }

    const parsedDuration = Number(durationSeconds);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 15 || parsedDuration > 60) {
      return res.status(400).json({ message: "Recording duration must be 15-60 seconds" });
    }

    if (videoUrl.length > 45 * 1024 * 1024) {
      return res.status(413).json({ message: "Video payload is too large for upload" });
    }

    const luminaLog = await LuminaLog.create({
      userId: req.user._id,
      mode,
      theme,
      quote: String(quote).trim(),
      videoUrl,
      durationSeconds: parsedDuration,
      echoReply: String(echoReply).trim(),
      reelStatus: isSunday(new Date()) ? "weekly_ready" : "none",
    });

    res.status(201).json(luminaLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const deleted = await LuminaLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Lumina log not found" });
    }

    res.json({ message: "Lumina log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLogs,
  createLog,
  deleteLog,
};
