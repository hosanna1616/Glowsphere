import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import StudyPodApi from "../../api/studyPodApi";
import UserApi from "../../api/userApi";
import { joinStudyPodRoom } from "../../api/studySocket";
import GlowDebriefPanel from "./GlowDebriefPanel";
import PodInviteModal from "./PodInviteModal";
import StudyProgressRing from "./StudyProgressRing";
import { classicalTracks, silentReactions, timerPresets } from "./studyConfig";

const SilentPodPanel = ({
  showToast,
  onLockStateChange,
}) => {
  const [pods, setPods] = useState([]);
  const [activePodId, setActivePodId] = useState(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [podName, setPodName] = useState("");
  const [podType, setPodType] = useState("silent");
  const [podTimerMinutes, setPodTimerMinutes] = useState(25);
  const [podTrackKey, setPodTrackKey] = useState(classicalTracks[0].key);

  const activePod = useMemo(
    () => pods.find((pod) => String(pod._id || pod.id) === String(activePodId)) || null,
    [pods, activePodId]
  );

  const loadPods = async () => {
    try {
      const podData = await StudyPodApi.listPods();
      setPods(podData || []);
      if (!activePodId && podData?.length) {
        setActivePodId(podData[0]._id || podData[0].id);
      }
    } catch (error) {
      showToast(error.message || "Failed to load silent pods", "error");
    }
  };

  useEffect(() => {
    loadPods();
  }, []);

  useEffect(() => {
    if (!activePod) {
      onLockStateChange?.(null);
      return;
    }

    const isActive = activePod.sessionState?.status === "active";
    onLockStateChange?.(
      isActive
        ? {
            podId: activePod._id,
            podName: activePod.name,
            endsAt: activePod.sessionState?.endsAt,
          }
        : null
    );

    const socket = joinStudyPodRoom(activePod._id || activePod.id);
    const syncPod = (payload) => {
      const nextPod = payload?.podId ? null : payload;
      if (nextPod) {
        setPods((previousPods) =>
          previousPods.map((pod) =>
            String(pod._id || pod.id) === String(nextPod._id || nextPod.id) ? nextPod : pod
          )
        );
      } else {
        loadPods();
      }
    };

    socket.on("study_pod_updated", syncPod);
    socket.on("study_session_state", syncPod);

    return () => {
      socket.off("study_pod_updated", syncPod);
      socket.off("study_session_state", syncPod);
    };
  }, [activePod]);

  useEffect(() => {
    if (inviteUsername.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timerId = setTimeout(async () => {
      try {
        const users = await UserApi.searchUsers(inviteUsername.trim());
        setSearchResults(users || []);
      } catch (error) {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timerId);
  }, [inviteUsername]);

  const handleCreatePod = async () => {
    try {
      const createdPod = await StudyPodApi.createPod({
        name: podName || `Glow ${podType === "private" ? "Private" : "Silent"} Pod`,
        podType,
      });
      setPods((previousPods) => [createdPod, ...previousPods]);
      setActivePodId(createdPod._id || createdPod.id);
      setPodName("");
      showToast("Glow pod created successfully", "success");
    } catch (error) {
      showToast(error.message || "Failed to create pod", "error");
    }
  };

  const handleInvite = async (username) => {
    if (!activePod) {
      return;
    }
    try {
      const updatedPod = await StudyPodApi.inviteToPod(activePod._id || activePod.id, username);
      setPods((previousPods) =>
        previousPods.map((pod) =>
          String(pod._id || pod.id) === String(updatedPod._id || updatedPod.id) ? updatedPod : pod
        )
      );
      setInviteUsername("");
      setShowInviteModal(false);
      showToast(`Invite sent to @${username}`, "success");
    } catch (error) {
      showToast(error.message || "Failed to send invite", "error");
    }
  };

  const handleInviteResponse = async (podId, action) => {
    try {
      const updatedPod = await StudyPodApi.respondToInvite(podId, action);
      setPods((previousPods) =>
        previousPods.map((pod) =>
          String(pod._id || pod.id) === String(updatedPod._id || updatedPod.id) ? updatedPod : pod
        )
      );
      if (action === "accept") {
        setActivePodId(updatedPod._id || updatedPod.id);
      }
      showToast(`Invite ${action}ed`, action === "accept" ? "success" : "info");
    } catch (error) {
      showToast(error.message || "Failed to update invite", "error");
    }
  };

  const handleStartPodSession = async () => {
    if (!activePod) {
      return;
    }
    try {
      const updatedPod = await StudyPodApi.startSession(activePod._id || activePod.id, {
        timerMinutes: podTimerMinutes,
        trackKey: podTrackKey,
      });
      setPods((previousPods) =>
        previousPods.map((pod) =>
          String(pod._id || pod.id) === String(updatedPod._id || updatedPod.id) ? updatedPod : pod
        )
      );
      showToast("Silent pod session started", "success");
    } catch (error) {
      showToast(error.message || "Failed to start pod session", "error");
    }
  };

  const handleOpenDebrief = async () => {
    if (!activePod) {
      return;
    }
    try {
      const updatedPod = await StudyPodApi.openDebrief(activePod._id || activePod.id);
      setPods((previousPods) =>
        previousPods.map((pod) =>
          String(pod._id || pod.id) === String(updatedPod._id || updatedPod.id) ? updatedPod : pod
        )
      );
      showToast("Glow Debrief is now open", "success");
    } catch (error) {
      showToast(error.message || "Failed to open debrief", "error");
    }
  };

  const handleReaction = async (emoji) => {
    if (!activePod) {
      return;
    }
    try {
      await StudyPodApi.sendReaction(activePod._id || activePod.id, emoji);
      const refreshedPod = await StudyPodApi.getPod(activePod._id || activePod.id);
      setPods((previousPods) =>
        previousPods.map((pod) =>
          String(pod._id || pod.id) === String(refreshedPod._id || refreshedPod.id)
            ? refreshedPod
            : pod
        )
      );
    } catch (error) {
      showToast(error.message || "Failed to send reaction", "error");
    }
  };

  const handleSendDebriefText = async (message) => {
    if (!activePod) {
      return;
    }
    await StudyPodApi.sendDebriefText(activePod._id || activePod.id, message);
    const refreshedPod = await StudyPodApi.getPod(activePod._id || activePod.id);
    setPods((previousPods) =>
      previousPods.map((pod) =>
        String(pod._id || pod.id) === String(refreshedPod._id || refreshedPod.id)
          ? refreshedPod
          : pod
      )
    );
  };

  const handleSendDebriefVoice = async (audioBlob, durationSeconds) => {
    if (!activePod) {
      return;
    }
    await StudyPodApi.sendDebriefVoice(activePod._id || activePod.id, audioBlob, durationSeconds);
    const refreshedPod = await StudyPodApi.getPod(activePod._id || activePod.id);
    setPods((previousPods) =>
      previousPods.map((pod) =>
        String(pod._id || pod.id) === String(refreshedPod._id || refreshedPod.id)
          ? refreshedPod
          : pod
      )
    );
  };

  return (
    <div className="space-y-6">
      <PodInviteModal
        isOpen={showInviteModal}
        inviteUsername={inviteUsername}
        setInviteUsername={setInviteUsername}
        searchResults={searchResults}
        onInvite={handleInvite}
        onClose={() => setShowInviteModal(false)}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[2rem] border border-fuchsia-300/15 bg-white/5 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-200/70">Glow Silent Pods</p>
              <h2 className="text-2xl font-semibold text-amber-100">Study with focused sister energy</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={podName}
              onChange={(event) => setPodName(event.target.value)}
              placeholder="Name your pod"
              className="rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-3 text-amber-50 outline-none"
            />
            <select
              value={podType}
              onChange={(event) => setPodType(event.target.value)}
              className="rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-3 text-amber-50 outline-none"
            >
              <option value="silent">Join Silent Pod</option>
              <option value="private">Create Private Pod</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleCreatePod}
            className="mt-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-6 py-3 font-semibold text-black"
          >
            Create Pod
          </button>

          <div className="mt-6 space-y-3">
            {pods.length ? (
              pods.map((pod) => {
                const isActive = String(pod._id || pod.id) === String(activePodId);
                const hasPendingInvite = pod.invites?.some((invite) => invite.status === "pending");
                return (
                  <motion.button
                    key={pod._id || pod.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    onClick={() => setActivePodId(pod._id || pod.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      isActive
                        ? "border-amber-300/30 bg-amber-300/10"
                        : "border-white/10 bg-stone-950/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-amber-100">{pod.name}</div>
                        <div className="text-sm text-amber-100/60">
                          {pod.participants?.length || 0} members • {pod.podType}
                        </div>
                      </div>
                      <div className="text-right text-sm text-amber-200/80">
                        {pod.sessionState?.status === "active" ? "Studying" : "Ready"}
                        <div>{pod.sharedCoveragePercent || 0}% together</div>
                      </div>
                    </div>
                    {hasPendingInvite ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleInviteResponse(pod._id || pod.id, "accept");
                          }}
                          className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-semibold text-black"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleInviteResponse(pod._id || pod.id, "decline");
                          }}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-amber-100"
                        >
                          Decline
                        </button>
                      </div>
                    ) : null}
                  </motion.button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-amber-100/60">
                Create a pod to begin your silent-study circle.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-300/15 bg-stone-950/60 p-6">
          {activePod ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-amber-100">{activePod.name}</h3>
                  <p className="text-sm text-amber-100/60">
                    Pod has covered {activePod.sharedCoveragePercent || 0}% together.
                  </p>
                </div>
                <StudyProgressRing
                  value={activePod.sharedCoveragePercent || 0}
                  size={130}
                  label="Pod covered"
                  subtitle="together"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 text-sm font-medium text-amber-100">Members</div>
                <div className="flex flex-wrap gap-2">
                  {(activePod.participants || []).map((participant) => (
                    <span
                      key={participant.userId}
                      className="rounded-full border border-white/10 bg-stone-900/70 px-3 py-1 text-sm text-amber-50"
                    >
                      @{participant.username} • {participant.coveragePercent || 0}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={podTimerMinutes}
                  onChange={(event) => setPodTimerMinutes(Number(event.target.value))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-amber-50 outline-none"
                >
                  {timerPresets.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset} minute pod
                    </option>
                  ))}
                </select>
                <select
                  value={podTrackKey}
                  onChange={(event) => setPodTrackKey(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-amber-50 outline-none"
                >
                  {classicalTracks.map((track) => (
                    <option key={track.key} value={track.key}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-amber-100"
                >
                  Invite Friends
                </button>
                <button
                  type="button"
                  onClick={handleStartPodSession}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-300 px-5 py-2.5 text-sm font-semibold text-black"
                >
                  Start Silent Session
                </button>
                <button
                  type="button"
                  onClick={handleOpenDebrief}
                  className="rounded-full border border-amber-300/20 px-5 py-2.5 text-sm font-semibold text-amber-100"
                >
                  Open Debrief
                </button>
              </div>

              {activePod.sessionState?.status === "active" ? (
                <div className="rounded-3xl border border-fuchsia-300/15 bg-fuchsia-400/10 p-4">
                  <div className="mb-3 text-sm text-amber-100/70">
                    Silent mode is active. Reactions only while the timer glows.
                  </div>
                  <div className="flex gap-3">
                    {silentReactions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(emoji)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-2xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {activePod.sessionState?.status === "debrief" ? (
                <GlowDebriefPanel
                  pod={activePod}
                  onSendText={handleSendDebriefText}
                  onSendVoice={handleSendDebriefVoice}
                />
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-amber-100/60">
              Select or create a pod to unlock shared progress, reactions, and the Glow Debrief.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SilentPodPanel;
