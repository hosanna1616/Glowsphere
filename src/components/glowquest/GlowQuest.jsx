import React, { useEffect, useMemo, useRef, useState } from "react";
import questApi from "../../api/questApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const GlowQuest = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [newComment, setNewComment] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newReminderAt, setNewReminderAt] = useState({});
  const [reminders, setReminders] = useState([]);
  const reminderTimersRef = useRef({});
  const [newQuestForm, setNewQuestForm] = useState({
    title: "",
    description: "",
    difficulty: "Beginner",
    xp: 100,
    tags: "",
    deadline: "",
  });

  const normalizeQuest = (quest) => ({
    ...quest,
    _id: quest?._id || quest?.id,
    tags: Array.isArray(quest?.tags) ? quest.tags : [],
    progress: Array.isArray(quest?.progress) ? quest.progress : [],
    supporters: Array.isArray(quest?.supporters) ? quest.supporters : [],
    comments: Array.isArray(quest?.comments) ? quest.comments : [],
  });

  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      gainNode.gain.setValueAtTime(0.001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        context.currentTime + 0.02
      );
      oscillator.start();
      oscillator.frequency.exponentialRampToValueAtTime(
        660,
        context.currentTime + 0.35
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.45
      );
      oscillator.stop(context.currentTime + 0.5);
    } catch (error) {
      console.error("Alarm sound failed:", error);
    }
  };

  const getQuestProgress = (quest) => {
    const mine = (quest.progress || []).find(
      (item) => String(item.userId) === String(user?._id)
    );
    return mine?.percentage || 0;
  };

  const getQuestStatus = (quest) => {
    const progress = getQuestProgress(quest);
    if (progress >= 100) return "completed";
    if (progress > 0) return "in-progress";
    return "not-started";
  };

  const isSupportingQuest = (quest) =>
    (quest.supporters || []).some(
      (supporter) => String(supporter.userId) === String(user?._id)
    );

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (filter === "all") return true;
      if (["not-started", "in-progress", "completed"].includes(filter)) {
        return getQuestStatus(quest) === filter;
      }
      return String(quest.difficulty || "").toLowerCase() === filter;
    });
  }, [quests, filter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-amber-500";
      case "in-progress":
        return "bg-amber-400";
      case "not-started":
        return "bg-stone-700";
      default:
        return "bg-stone-700";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-amber-500/20 text-amber-300";
      case "Intermediate":
        return "bg-amber-400/20 text-amber-200";
      case "Advanced":
        return "bg-amber-600/20 text-amber-400";
      default:
        return "bg-stone-700/20 text-amber-300";
    }
  };

  const hydrateComments = (questList) => {
    const commentMap = {};
    questList.forEach((quest) => {
      commentMap[quest._id] = quest.comments || [];
    });
    setComments(commentMap);
  };

  const loadQuests = async () => {
    try {
      const data = await questApi.getQuests();
      const list = (Array.isArray(data) ? data : []).map(normalizeQuest);
      setQuests(list);
      hydrateComments(list);
    } catch (error) {
      showToast(error.message || "Failed to load quests", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await questApi.getReminders();
      setReminders(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(error.message || "Failed to load reminders", "error");
    }
  };

  useEffect(() => {
    loadQuests();
    loadReminders();
    const polling = setInterval(() => {
      loadQuests();
      loadReminders();
    }, 30000);
    return () => clearInterval(polling);
  }, []);

  useEffect(() => {
    Object.values(reminderTimersRef.current).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    reminderTimersRef.current = {};

    reminders.forEach((reminder) => {
      const msUntilReminder = new Date(reminder.remindAt).getTime() - Date.now();
      if (msUntilReminder <= 0) return;
      reminderTimersRef.current[reminder._id] = setTimeout(async () => {
        try {
          if (typeof Notification !== "undefined") {
            if (Notification.permission === "granted") {
              new Notification("GlowSphere", {
                body: `${reminder.title} is due now`,
                icon: "/glowsphere-logo.png",
                badge: "/glowsphere-logo.png",
                tag: `quest-reminder-${reminder._id}`,
                requireInteraction: true,
              });
            } else if (Notification.permission !== "denied") {
              await Notification.requestPermission();
            }
          }
          playAlarmSound();
          showToast(`Reminder: ${reminder.title}`, "success");
        } catch (error) {
          console.error("Reminder notification error:", error);
        } finally {
          await questApi.deleteReminder(reminder._id);
          setReminders((prev) => prev.filter((item) => item._id !== reminder._id));
        }
      }, msUntilReminder);
    });

    return () => {
      Object.values(reminderTimersRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, [reminders]);

  const toggleComments = (questId) => {
    setShowComments((prev) => ({ ...prev, [questId]: !prev[questId] }));
  };

  const handleProgressUpdate = async (id, progress) => {
    const safeProgress = Math.max(0, Math.min(100, progress));
    try {
      const updatedProgress = await questApi.updateProgress(id, safeProgress);
      setQuests((prev) =>
        prev.map((quest) => {
          if (quest._id !== id) return quest;
          const others = (quest.progress || []).filter(
            (item) => String(item.userId) !== String(user?._id)
          );
          return { ...quest, progress: [...others, updatedProgress] };
        })
      );
    } catch (error) {
      showToast(error.message || "Failed to update progress", "error");
    }
  };

  const handleStartQuest = async (id) => {
    await handleProgressUpdate(id, 10);
  };

  const handleCompleteQuest = async (id) => {
    await handleProgressUpdate(id, 100);
  };

  const handleAddComment = async (questId) => {
    const commentText = newComment[questId];
    if (!commentText || !commentText.trim()) return;
    try {
      const comment = await questApi.addComment(questId, commentText.trim());
      setComments((prev) => ({
        ...prev,
        [questId]: [...(prev[questId] || []), comment],
      }));
      setNewComment((prev) => ({ ...prev, [questId]: "" }));
    } catch (error) {
      showToast(error.message || "Failed to add comment", "error");
    }
  };

  const handleSupportToggle = async (quest) => {
    try {
      const response = isSupportingQuest(quest)
        ? await questApi.unsupportQuest(quest._id)
        : await questApi.supportQuest(quest._id);
      setQuests((prev) =>
        prev.map((item) =>
          item._id === quest._id
            ? { ...item, supporters: response.supporters || item.supporters }
            : item
        )
      );
    } catch (error) {
      showToast(error.message || "Support action failed", "error");
    }
  };

  const handleCreateQuest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newQuestForm.title.trim(),
        description: newQuestForm.description.trim(),
        difficulty: newQuestForm.difficulty,
        xp: Number(newQuestForm.xp) || 100,
        tags: newQuestForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        deadline: newQuestForm.deadline,
      };
      const created = await questApi.createQuest(payload);
      const normalizedCreated = normalizeQuest(created);
      setQuests((prev) => [normalizedCreated, ...prev]);
      setComments((prev) => ({
        ...prev,
        [normalizedCreated._id]: normalizedCreated.comments || [],
      }));
      setFilter("all");
      setNewQuestForm({
        title: "",
        description: "",
        difficulty: "Beginner",
        xp: 100,
        tags: "",
        deadline: "",
      });
      setShowNewQuest(false);
      showToast("Quest created successfully", "success");
      await loadQuests();
    } catch (error) {
      showToast(error.message || "Failed to create quest", "error");
    }
  };

  const handleCreateReminder = async (quest) => {
    const remindAt = newReminderAt[quest._id];
    if (!remindAt) {
      showToast("Select date and time for reminder", "warning");
      return;
    }
    try {
      const reminder = await questApi.createReminder({
        questId: quest._id,
        title: quest.title,
        remindAt,
      });
      setReminders((prev) =>
        [...prev, reminder].sort(
          (a, b) => new Date(a.remindAt) - new Date(b.remindAt)
        )
      );
      setNewReminderAt((prev) => ({ ...prev, [quest._id]: "" }));
      showToast("Reminder added", "success");
    } catch (error) {
      showToast(error.message || "Failed to add reminder", "error");
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-400">GlowQuest</h1>
        <button
          className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center text-black"
          onClick={() => setShowNewQuest(!showNewQuest)}
        >
          <span className="mr-2">+</span> New Quest
        </button>
      </div>

      {showNewQuest && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Create New Quest
          </h2>
          <form onSubmit={handleCreateQuest}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-amber-200 mb-2">Quest Title</label>
                <input
                  type="text"
                  value={newQuestForm.title}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                  placeholder="e.g., Build a REST API with Express"
                  required
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Difficulty</label>
                <select
                  value={newQuestForm.difficulty}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-amber-200 mb-2">XP Reward</label>
                <input
                  type="number"
                  value={newQuestForm.xp}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({ ...prev, xp: e.target.value }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Deadline</label>
                <input
                  type="date"
                  value={newQuestForm.deadline}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Description</label>
                <textarea
                  value={newQuestForm.description}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                  rows="3"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Tags</label>
                <input
                  type="text"
                  value={newQuestForm.tags}
                  onChange={(e) =>
                    setNewQuestForm((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                  placeholder="React, JavaScript, Frontend"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                onClick={() => setShowNewQuest(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 text-black"
              >
                Create Quest
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
        <h2 className="text-xl font-bold text-amber-300 mb-3">
          Alarm & Reminder Center
        </h2>
        {reminders.length === 0 ? (
          <p className="text-amber-200 text-sm">
            No active reminders. Add reminder alarms from quest cards below.
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder._id}
                className="flex items-center justify-between bg-stone-800/60 rounded-lg px-3 py-2"
              >
                <div className="text-amber-200 text-sm">
                  {reminder.title} - {new Date(reminder.remindAt).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await questApi.deleteReminder(reminder._id);
                    setReminders((prev) =>
                      prev.filter((item) => item._id !== reminder._id)
                    );
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-stone-700 text-amber-200 hover:bg-stone-600"
                >
                  Cancel Reminder
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          ["all", "All Quests"],
          ["not-started", "Available"],
          ["in-progress", "In Progress"],
          ["completed", "Completed"],
          ["beginner", "Beginner"],
          ["intermediate", "Intermediate"],
          ["advanced", "Advanced"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`px-4 py-2 rounded-full ${
              filter === value
                ? "bg-gold-gradient text-black font-semibold"
                : "bg-card-bg border border-amber-500/30 text-amber-200"
            }`}
            onClick={() => {
              setFilter(value);
              setShowNewQuest(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="text-amber-200 text-center py-8">Loading quests...</div>
        )}
        {filteredQuests.map((quest) => {
          const questStatus = getQuestStatus(quest);
          const questProgress = getQuestProgress(quest);
          return (
            <div
              key={quest._id}
              className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-amber-300">
                    {quest.title}
                  </h3>
                  <p className="text-amber-200 mb-4">{quest.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(
                        quest.difficulty
                      )}`}
                    >
                      {quest.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">
                      🔥 {quest.xp} XP
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-stone-700/20 text-amber-200">
                      ⏳ Due {new Date(quest.deadline).toLocaleDateString()}
                    </span>
                    {(quest.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    questStatus
                  )} text-black font-semibold`}
                >
                  {questStatus.replace("-", " ")}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-200">Progress</span>
                  <span className="text-amber-200">{questProgress}%</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2">
                  <div
                    className="bg-gold-gradient h-2 rounded-full"
                    style={{ width: `${questProgress}%` }}
                  />
                </div>

                {questStatus === "in-progress" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() =>
                        handleProgressUpdate(quest._id, questProgress - 10)
                      }
                      className="w-8 h-8 rounded-full bg-stone-700 text-amber-300 flex items-center justify-center"
                      disabled={questProgress <= 0}
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={questProgress}
                      onChange={(e) =>
                        handleProgressUpdate(
                          quest._id,
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() =>
                        handleProgressUpdate(quest._id, questProgress + 10)
                      }
                      className="w-8 h-8 rounded-full bg-stone-700 text-amber-300 flex items-center justify-center"
                      disabled={questProgress >= 100}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {(quest.supporters || []).length > 0 && (
                <div className="mb-4 text-sm text-amber-200">
                  Supported by: {(quest.supporters || []).map((s) => s.username).join(", ")}
                </div>
              )}

              <div className="mb-4 flex flex-col md:flex-row gap-2 md:items-center">
                <input
                  type="datetime-local"
                  value={newReminderAt[quest._id] || ""}
                  onChange={(e) =>
                    setNewReminderAt((prev) => ({
                      ...prev,
                      [quest._id]: e.target.value,
                    }))
                  }
                  className="bg-stone-800 border border-amber-500/30 rounded-lg p-2 text-amber-200"
                />
                <button
                  type="button"
                  onClick={() => handleCreateReminder(quest)}
                  className="px-4 py-2 rounded-full bg-stone-700 text-amber-200 hover:bg-stone-600 text-sm"
                >
                  Set Reminder Alarm
                </button>
              </div>

              <div className="mb-4">
                <button
                  className="text-amber-300 font-semibold mb-2 flex items-center"
                  onClick={() => toggleComments(quest._id)}
                >
                  <span>💬 Community Support</span>
                  <span className="ml-2 text-amber-400/70 text-sm">
                    ({comments[quest._id] ? comments[quest._id].length : 0} comments)
                  </span>
                </button>

                {showComments[quest._id] && (
                  <div className="bg-stone-800/50 rounded-lg p-4 mt-2">
                    {comments[quest._id] && comments[quest._id].length > 0 ? (
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {comments[quest._id].map((comment) => (
                          <div key={comment._id} className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold mr-2 mt-1">
                              {(comment.username || "U").charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-stone-700 rounded-lg p-3">
                                <div className="flex justify-between">
                                  <span className="font-medium text-amber-300 text-sm">
                                    {comment.username}
                                  </span>
                                  <span className="text-amber-400 text-xs">
                                    {new Date(
                                      comment.timestamp || comment.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-amber-200 text-sm mt-1">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-amber-400 text-center py-2">
                        No comments yet. Be the first to encourage!
                      </p>
                    )}

                    <div className="flex mt-3">
                      <input
                        type="text"
                        value={newComment[quest._id] || ""}
                        onChange={(e) =>
                          setNewComment((prev) => ({
                            ...prev,
                            [quest._id]: e.target.value,
                          }))
                        }
                        placeholder="Add a comment to support..."
                        className="flex-1 bg-stone-700 border border-amber-500/30 rounded-l-lg p-2 text-amber-200"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddComment(quest._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(quest._id)}
                        className="bg-amber-500 text-black px-4 rounded-r-lg font-medium disabled:opacity-50"
                        disabled={
                          !newComment[quest._id] || !newComment[quest._id].trim()
                        }
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                {questStatus === "not-started" && (
                  <button
                    className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 text-black"
                    onClick={() => handleStartQuest(quest._id)}
                  >
                    Start Quest
                  </button>
                )}
                {questStatus === "in-progress" && (
                  <>
                    <button
                      onClick={() => handleSupportToggle(quest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        isSupportingQuest(quest)
                          ? "bg-amber-500 text-black"
                          : "bg-stone-700 text-amber-300 hover:bg-stone-600"
                      }`}
                    >
                      {isSupportingQuest(quest) ? "❤️ Supporting" : "🤍 Support"}
                    </button>
                    <button
                      className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 text-black"
                      onClick={() => handleCompleteQuest(quest._id)}
                    >
                      Complete Quest
                    </button>
                  </>
                )}
                {questStatus === "completed" && (
                  <button
                    className="px-4 py-2 bg-amber-500 rounded-full text-sm font-medium text-black"
                    disabled
                  >
                    ✓ Completed
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!loading && filteredQuests.length === 0 && (
          <div className="bg-card-bg border border-amber-500/30 rounded-xl p-8 text-center">
            <div className="text-amber-300 text-xl font-semibold mb-2">
              No quests in this view
            </div>
            <div className="text-amber-200 text-sm">
              Switch filters or create a new quest to see it here.
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {quests.filter((q) => getQuestStatus(q) === "in-progress").length}
          </div>
          <div className="text-amber-200">Active Quests</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {quests.filter((q) => getQuestStatus(q) === "completed").length}
          </div>
          <div className="text-amber-200">Completed Quests</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {quests
              .filter((q) => getQuestStatus(q) === "completed")
              .reduce((sum, q) => sum + (q.xp || 0), 0)}
          </div>
          <div className="text-amber-200">Total XP</div>
        </div>
      </div>
    </div>
  );
};

export default GlowQuest;
