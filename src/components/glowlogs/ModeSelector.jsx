import React from "react";

const MODES = [
  { id: "release", title: "Release Mode", subtitle: "Let it out safely" },
  { id: "glow_up", title: "Glow Up Mode", subtitle: "Skincare + outfit confidence" },
  { id: "future_self", title: "Future Self Mode", subtitle: "Talk to the woman ahead" },
  { id: "gratitude_glow", title: "Gratitude Glow Mode", subtitle: "Celebrate what you are proud of" },
];

const ModeSelector = ({ selectedMode, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`rounded-2xl p-5 border text-left transition-all ${
            selectedMode === mode.id
              ? "border-amber-300 bg-amber-100/10 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
        >
          <div className="text-xl font-semibold text-amber-100">{mode.title}</div>
          <div className="text-sm text-amber-200/80 mt-1">{mode.subtitle}</div>
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;
