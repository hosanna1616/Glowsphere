import React from "react";
import { useNavigate } from "react-router-dom";

const Pulse = () => {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => navigate("/feed")}
          className="absolute left-4 text-amber-300 hover:text-amber-200 text-xl"
        >
          ←
        </button>
        <h1 className="text-3xl font-bold text-amber-400">Pulse</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden bg-card-bg backdrop-blur-sm rounded-2xl border border-amber-500/30 p-8 md:p-10">
          <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-12 w-44 h-44 rounded-full bg-amber-600/10 blur-2xl" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gold-gradient flex items-center justify-center text-black text-3xl shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              ⚡
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-amber-300 text-center mb-3">
              Pulse Is Coming Soon
            </h2>
            <p className="text-amber-100/90 text-center max-w-xl mx-auto mb-8">
              We are crafting a beautiful new Pulse experience to help you track
              your emotional rhythm, energy, and wellbeing in one place.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <div className="rounded-xl border border-amber-500/20 bg-stone-900/50 px-4 py-3 text-amber-200 text-sm text-center">
                Smart Mood Timeline
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-stone-900/50 px-4 py-3 text-amber-200 text-sm text-center">
                Cycle-Aware Insights
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-stone-900/50 px-4 py-3 text-amber-200 text-sm text-center">
                Gentle Wellness Nudges
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/feed")}
                className="px-6 py-2.5 rounded-full bg-gold-gradient text-black font-semibold hover:opacity-90 transition-opacity"
              >
                Back to Feed
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-2.5 rounded-full border border-amber-500/30 text-amber-200 hover:bg-stone-800 transition-colors"
              >
                Update Profile Goals
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-amber-300/70 text-sm mt-4">
          Thank you for growing with GlowSphere.
        </p>
      </div>
    </div>
  );
};

export default Pulse;
