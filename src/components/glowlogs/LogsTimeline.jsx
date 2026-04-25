import React, { useState } from "react";

const modeLabel = {
  release: "Release",
  glow_up: "Glow Up",
  future_self: "Future Self",
  gratitude_glow: "Gratitude Glow",
};

const themeLabel = {
  rose_gold: "Rose Gold",
  moonlit: "Moonlit",
  fairy_lights: "Fairy Lights",
  sunset_blush: "Sunset Blush",
};

const formatDate = (value) => new Date(value).toLocaleString();

const LogsTimeline = ({ logs, weeklyReel, onDeleteLog }) => {
  const [activeMenuId, setActiveMenuId] = useState(null);

  return (
    <section className="space-y-5">
      <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-5">
        <div className="text-lg font-semibold text-amber-100">Lumina Glow Reel</div>
        <div className="text-amber-200/80 mt-1">
          {weeklyReel?.status === "ready"
            ? "Weekly Growth Reel Ready"
            : weeklyReel?.message || "Record this week to unlock your reel."}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {logs.map((log) => (
          <article
            key={log._id}
            className="bg-card-bg border border-amber-500/30 rounded-2xl p-4 space-y-3"
          >
            <div className="flex justify-end relative">
              <button
                onClick={() =>
                  setActiveMenuId((current) =>
                    current === log._id ? null : log._id
                  )
                }
                className="w-8 h-8 rounded-full border border-amber-500/30 text-amber-100 hover:bg-stone-800"
                aria-label="Log actions"
              >
                ⋯
              </button>
              {activeMenuId === log._id && (
                <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-amber-500/30 bg-stone-900 shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      onDeleteLog?.(log._id);
                      setActiveMenuId(null);
                    }}
                    className="w-full px-4 py-3 text-left text-red-300 hover:bg-stone-800"
                  >
                    Delete recorded video
                  </button>
                </div>
              )}
            </div>
            <video
              src={log.videoUrl}
              controls
              className="w-full h-56 object-cover rounded-xl border border-amber-500/20"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-stone-800 text-amber-100 border border-amber-500/20">
                {modeLabel[log.mode] || log.mode}
              </span>
              <span className="px-2 py-1 rounded-full bg-stone-800 text-amber-100 border border-amber-500/20">
                {themeLabel[log.theme] || log.theme}
              </span>
              <span className="px-2 py-1 rounded-full bg-stone-800 text-amber-100 border border-amber-500/20">
                {log.durationSeconds}s
              </span>
            </div>
            <p className="text-sm text-amber-200/90">{log.echoReply}</p>
            <div className="text-xs text-amber-200/70">{formatDate(log.createdAt)}</div>
          </article>
        ))}
      </div>
      {logs.length === 0 && (
        <div className="text-amber-200/75 text-sm">No Lumina logs yet. Record your first glow moment.</div>
      )}
    </section>
  );
};

export default LogsTimeline;
