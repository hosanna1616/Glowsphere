import React, { useRef, useState } from "react";
import { resolveStudyMediaUrl } from "./studyConfig";

const GlowDebriefPanel = ({ pod, onSendText, onSendVoice, disabled = false }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startedAtRef = useRef(0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }
    await onSendText?.(message.trim());
    setMessage("");
  };

  const toggleVoiceRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    startedAtRef.current = Date.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      await onSendVoice?.(blob, durationSeconds);
      stream.getTracks().forEach((track) => track.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const entries = pod?.debriefEntries || [];

  return (
    <div className="rounded-[2rem] border border-amber-300/15 bg-white/5 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-amber-100">Glow Debrief</h3>
        <p className="text-sm text-amber-100/70">
          Five luminous minutes for voice notes and reflection after the silent session.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Share what you accomplished, what felt hard, or your next step..."
          className="w-full rounded-2xl border border-white/10 bg-stone-950/60 p-4 text-amber-50 outline-none transition focus:border-amber-300/30"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-5 py-2.5 font-semibold text-black disabled:opacity-50"
          >
            Send Reflection
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={toggleVoiceRecording}
            className={`rounded-full px-5 py-2.5 font-semibold ${
              isRecording ? "bg-red-500 text-white" : "border border-white/10 bg-white/5 text-amber-100"
            }`}
          >
            {isRecording ? "Stop Voice Note" : "Record Voice Note"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {entries.length ? (
          entries
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry._id || `${entry.username}-${entry.createdAt}`} className="rounded-2xl border border-white/10 bg-stone-950/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-amber-100/60">
                  <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                    @{entry.username}
                  </span>
                  <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                </div>
                {entry.entryType === "voice" ? (
                  <audio controls src={resolveStudyMediaUrl(entry.voiceUrl)} className="w-full" />
                ) : (
                  <p className="text-sm text-amber-50 break-words [overflow-wrap:anywhere]">
                    {entry.message}
                  </p>
                )}
              </div>
            ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-amber-100/60">
            Debrief reflections will appear here as soon as the session opens.
          </div>
        )}
      </div>
    </div>
  );
};

export default GlowDebriefPanel;
