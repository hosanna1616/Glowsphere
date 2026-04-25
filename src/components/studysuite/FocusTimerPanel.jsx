import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import ClassicalMusicPlayer from "./ClassicalMusicPlayer";
import { classicalTracks, timerPresets } from "./studyConfig";

const BREAK_MINUTES = 5;

const playCompletionChime = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.15);
    gain.gain.setValueAtTime(0.0001, now + index * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.55);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.15);
    oscillator.stop(now + index * 0.15 + 0.6);
  });
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const FocusTimerPanel = ({
  documentCoverage = 0,
  onSessionStart,
  onSessionComplete,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [selectedTrackKey, setSelectedTrackKey] = useState(classicalTracks[0].key);
  const [timeLeft, setTimeLeft] = useState(selectedMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [completionMessage, setCompletionMessage] = useState("");
  const audioRef = useRef(null);

  const selectedTrack = useMemo(
    () => classicalTracks.find((track) => track.key === selectedTrackKey) || classicalTracks[0],
    [selectedTrackKey]
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((previousTimeLeft) => {
        if (previousTimeLeft <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return previousTimeLeft - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft > 0 || !isRunning) {
      return;
    }

    setIsRunning(false);

    if (!isBreak) {
      playCompletionChime();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.65 },
        colors: ["#f59e0b", "#d946ef", "#fde68a"],
      });
      setCompletionMessage(`Session Complete! You covered ${Math.round(documentCoverage)}%.`);
      onSessionComplete?.({
        selectedMinutes,
        selectedTrackKey,
        coverageAtEnd: documentCoverage,
      });
      setIsBreak(true);
      setTimeLeft(BREAK_MINUTES * 60);
      setTimeout(() => setIsRunning(true), 1200);
    } else {
      setCompletionMessage("Break complete. Your next glow session is ready.");
      setIsBreak(false);
      setTimeLeft(selectedMinutes * 60);
    }
  }, [timeLeft, isRunning, isBreak, selectedMinutes, selectedTrackKey, documentCoverage, onSessionComplete]);

  useEffect(() => {
    setTimeLeft((isBreak ? BREAK_MINUTES : selectedMinutes) * 60);
  }, [selectedMinutes, isBreak]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.src = selectedTrack.url;
    audioRef.current.load();
    if (isRunning) {
      audioRef.current.play().catch(() => {});
    }
  }, [selectedTrack, isRunning]);

  useEffect(() => {
    if (!audioRef.current) {
      return undefined;
    }

    if (isRunning) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }

    return undefined;
  }, [isRunning]);

  const handleStart = async () => {
    setCompletionMessage("");
    setIsBreak(false);
    setTimeLeft(selectedMinutes * 60);
    setIsRunning(true);
    await onSessionStart?.({
      timerPresetMinutes: selectedMinutes,
      actualDurationMinutes: selectedMinutes,
      trackKey: selectedTrackKey,
      coverageAtStart: documentCoverage,
      mode: "focus",
    });
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setCompletionMessage("");
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedMinutes * 60);
  };

  const progress = isBreak
    ? ((BREAK_MINUTES * 60 - timeLeft) / (BREAK_MINUTES * 60)) * 100
    : ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100;

  return (
    <div className="rounded-[2rem] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.18),_transparent_45%),rgba(10,10,20,0.86)] p-6 shadow-[0_0_40px_rgba(217,70,239,0.12)]">
      <audio ref={audioRef} loop />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">
            Lumina Focus Timer
          </p>
          <h2 className="text-2xl font-semibold text-amber-100">
            {isBreak ? "Glow Break" : "Deep Study Session"}
          </h2>
        </div>
        <div className="rounded-full border border-amber-300/20 bg-white/5 px-4 py-2 text-sm text-amber-100/80">
          {selectedTrack.name}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-amber-300/10 bg-white/5 p-6">
          <motion.div
            key={`${isBreak}-${selectedMinutes}`}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto flex max-w-sm flex-col items-center text-center"
          >
            <div className="relative mb-6 h-60 w-60 rounded-full border border-amber-200/10 bg-black/20">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 240 240">
                <circle cx="120" cy="120" r="100" stroke="rgba(255,255,255,0.08)" strokeWidth="16" fill="none" />
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  stroke="url(#timerGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={628.31}
                  strokeDashoffset={628.31 - (Math.max(0, Math.min(100, progress)) / 100) * 628.31}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#d946ef" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fde68a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-amber-50">{formatTime(timeLeft)}</div>
                <div className="mt-2 text-sm uppercase tracking-[0.25em] text-amber-200/70">
                  {isBreak ? "Break Time" : "Focus Glow"}
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {timerPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedMinutes(preset);
                    setIsBreak(false);
                    setIsRunning(false);
                    setTimeLeft(preset * 60);
                  }}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    preset === selectedMinutes
                      ? "bg-amber-300 text-black"
                      : "border border-white/10 bg-white/5 text-amber-100/80"
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-6 py-3 font-semibold text-black"
                >
                  Start Glow Session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="rounded-full bg-white/10 px-6 py-3 font-semibold text-amber-50"
                >
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-white/10 px-6 py-3 font-semibold text-amber-100"
              >
                Reset
              </button>
            </div>

            {completionMessage ? (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                {completionMessage}
              </div>
            ) : null}
          </motion.div>
        </div>

        <ClassicalMusicPlayer
          selectedTrackKey={selectedTrackKey}
          onSelectTrack={setSelectedTrackKey}
          volume={volume}
          onVolumeChange={setVolume}
        />
      </div>
    </div>
  );
};

export default FocusTimerPanel;
