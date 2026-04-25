import React, { useEffect, useState } from "react";
import MirrorFrame from "./MirrorFrame";
import ModeSelector from "./ModeSelector";
import RecordingArea from "./RecordingArea";
import LogsTimeline from "./LogsTimeline";
import LuminaLogsApi from "../../api/luminaLogsApi";
import { getDailyQuote } from "./luminaQuotes";
import { useToast } from "../../context/ToastContext";

const THEMES = [
  { id: "rose_gold", label: "Rose Gold" },
  { id: "moonlit", label: "Moonlit" },
  { id: "fairy_lights", label: "Fairy Lights" },
  { id: "sunset_blush", label: "Sunset Blush" },
];

const GlowLogs = () => {
  const { showToast } = useToast();
  const [selectedMode, setSelectedMode] = useState("release");
  const [selectedTheme, setSelectedTheme] = useState("rose_gold");
  const [logs, setLogs] = useState([]);
  const [weeklyReel, setWeeklyReel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [quote, setQuote] = useState(getDailyQuote());

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await LuminaLogsApi.getLogs();
      setLogs(response.logs || []);
      setWeeklyReel(response.weeklyReel || null);
      setQuote(getDailyQuote());
    } catch (error) {
      showToast(error.message || "Failed to load Lumina logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const saveLog = async (payload) => {
    try {
      setSaving(true);
      await LuminaLogsApi.createLog(payload);
      showToast("Lumina log saved privately", "success");
      await loadLogs();
    } catch (error) {
      showToast(error.message || "Could not save Lumina log", "error");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      await LuminaLogsApi.deleteLog(logId);
      showToast("Recorded video deleted", "success");
      await loadLogs();
    } catch (error) {
      showToast(error.message || "Failed to delete recorded video", "error");
    }
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-300">Lumina Mirror</h1>
          <p className="text-amber-200/85 mt-1">Your private mirror ritual for reflection and growth.</p>
        </div>
        <button
          onClick={() => setShowThemes((value) => !value)}
          className="px-4 py-2 rounded-full border border-amber-500/30 text-amber-100 hover:bg-stone-800"
        >
          Themes
        </button>
      </div>

      {showThemes && (
        <div className="flex flex-wrap gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`px-4 py-2 rounded-full border ${
                selectedTheme === theme.id
                  ? "border-amber-300 bg-amber-100/10 text-amber-100"
                  : "border-amber-500/30 text-amber-200"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      )}

      <MirrorFrame quote={quote} theme={selectedTheme}>
        <ModeSelector selectedMode={selectedMode} onSelect={setSelectedMode} />
        <div className="mt-6">
          <RecordingArea
            mode={selectedMode}
            theme={selectedTheme}
            quote={quote}
            onSave={saveLog}
          />
        </div>
      </MirrorFrame>

      <div className="bg-card-bg rounded-2xl p-5 border border-amber-500/30">
        <h2 className="text-2xl font-semibold text-amber-100 mb-3">Lumina Timeline</h2>
        {loading ? (
          <div className="text-amber-200/85">Loading your private logs...</div>
        ) : (
          <LogsTimeline logs={logs} weeklyReel={weeklyReel} onDeleteLog={handleDeleteLog} />
        )}
      </div>

      {saving && <div className="text-amber-200 text-sm">Saving your mirror session...</div>}
    </div>
  );
};

export default GlowLogs;
