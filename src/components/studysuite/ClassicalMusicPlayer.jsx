import React from "react";
import { classicalTracks } from "./studyConfig";

const ClassicalMusicPlayer = ({
  selectedTrackKey,
  onSelectTrack,
  volume,
  onVolumeChange,
}) => {
  return (
    <div className="rounded-3xl border border-fuchsia-400/20 bg-stone-950/60 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-amber-200">Classical Study Music</h3>
        <p className="text-sm text-amber-100/70">
          Choose a soft background score for your session.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {classicalTracks.map((track) => {
          const isActive = track.key === selectedTrackKey;
          return (
            <button
              key={track.key}
              type="button"
              onClick={() => onSelectTrack(track.key)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-amber-300 bg-amber-400/10 text-amber-100"
                  : "border-white/10 bg-white/5 text-amber-200/80 hover:border-fuchsia-300/30"
              }`}
            >
              <div className="font-medium">{track.name}</div>
              <div className="text-xs opacity-75">{track.title}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <label className="mb-2 block text-sm text-amber-100/80">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="w-full accent-amber-300"
        />
      </div>
    </div>
  );
};

export default ClassicalMusicPlayer;
