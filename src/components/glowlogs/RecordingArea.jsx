import React, { useEffect, useMemo, useRef, useState } from "react";

const ECHO_REPLIES = {
  release:
    "I hear you. What you are carrying matters. Breathe, and remember you are never too much for this world.",
  glow_up:
    "You look radiant because your energy is honest. Keep showing up for yourself with tenderness and consistency.",
  future_self:
    "Your future self is proud you chose courage today. Keep building the life she dreams from.",
  gratitude_glow:
    "You are becoming so beautifully grounded. Gratitude is your glow multiplier, and it already shows.",
};

const FILTER_BY_MODE = {
  release: "brightness(1.06) contrast(1.05) saturate(1.08) sepia(0.08)",
  glow_up: "brightness(1.08) contrast(1.08) saturate(1.15) blur(0.1px)",
  future_self: "brightness(1.04) contrast(1.04) saturate(1.1) hue-rotate(-4deg)",
  gratitude_glow: "brightness(1.1) contrast(1.03) saturate(1.12) sepia(0.05)",
};

const speak = (text) =>
  new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1.06;
    const voices = window.speechSynthesis.getVoices();
    const softVoice =
      voices.find((voice) =>
        /(female|zira|samantha|victoria|karen|moira)/i.test(voice.name)
      ) || voices[0];
    if (softVoice) {
      utterance.voice = softVoice;
    }
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const RecordingArea = ({ mode, theme, quote, onSave }) => {
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [recordingLeft, setRecordingLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const modeFilter = useMemo(() => FILTER_BY_MODE[mode] || FILTER_BY_MODE.release, [mode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (cameraError) {
      setError("Unable to access camera/mic. Please allow permissions and retry.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const finishRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError("Turn camera on before recording.");
      return;
    }

    setError("");
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          chunksRef.current = [];
          const recorder = new MediaRecorder(streamRef.current, {
            mimeType: "video/webm;codecs=vp8,opus",
          });
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };
          recorder.onstop = async () => {
            try {
              setIsSaving(true);
              const blob = new Blob(chunksRef.current, { type: "video/webm" });
              const videoUrl = await blobToDataUrl(blob);
              const echoReply = ECHO_REPLIES[mode] || ECHO_REPLIES.release;
              await speak(echoReply);
              await onSave({
                mode,
                theme,
                quote,
                videoUrl,
                durationSeconds,
                echoReply,
              });
            } catch (saveError) {
              setError("Failed to save Lumina log. Please retry.");
            } finally {
              setIsSaving(false);
            }
          };

          recorder.start();
          setIsRecording(true);
          setRecordingLeft(durationSeconds);
          timerRef.current = setInterval(() => {
            setRecordingLeft((left) => {
              if (left <= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                setIsRecording(false);
                finishRecording();
                return 0;
              }
              return left - 1;
            });
          }, 1000);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-black min-h-[300px]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-[360px] object-cover"
          style={{ filter: modeFilter }}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%)]" />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center text-amber-100">
            Turn on camera to begin
          </div>
        )}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">
            {countdown}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={isCameraOn ? stopCamera : startCamera}
          disabled={isRecording || isSaving}
          className="px-4 py-2 rounded-full border border-amber-500/40 text-amber-100 hover:bg-stone-800 disabled:opacity-50"
        >
          {isCameraOn ? "Stop Camera" : "Start Camera"}
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-amber-200">Duration</label>
          <select
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
            disabled={isRecording || isSaving}
            className="bg-stone-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-100"
          >
            {[15, 30, 45, 60].map((sec) => (
              <option key={sec} value={sec}>
                {sec}s
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={startRecording}
          disabled={!isCameraOn || isRecording || isSaving}
          className="px-6 py-3 rounded-full bg-gold-gradient text-black font-semibold shadow-[0_0_18px_rgba(251,191,36,0.45)] disabled:opacity-50"
        >
          {isRecording ? `Recording ${recordingLeft}s` : isSaving ? "Saving..." : "Record"}
        </button>
      </div>

      {error && <div className="text-red-300 text-sm">{error}</div>}
    </div>
  );
};

export default RecordingArea;
