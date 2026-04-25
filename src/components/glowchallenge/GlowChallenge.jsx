import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ChallengeApi from "../../api/challengeApi";

const GlowChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    deadline: "",
    duration: 30,
    rewards: "",
    requirements: "",
    category: "general",
  });

  // Load all challenges from API (real data, not filtered client-side by status tabs)
  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    if (!showCreateModal) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setShowCreateModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreateModal]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const challengeData = await ChallengeApi.getChallenges(null);
      setChallenges(challengeData || []);
    } catch (error) {
      console.error("Failed to load challenges:", error);
      showToast("Failed to load challenges. Please try again.", "error");
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-amber-500";
      case "completed":
        return "bg-amber-600";
      case "upcoming":
        return "bg-amber-400";
      default:
        return "bg-stone-700";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return 0;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUserProgress = (challenge) => {
    if (!user || !challenge.participants) return 0;
    const participant = challenge.participants.find(
      (p) =>
        p.userId?._id?.toString() === user._id?.toString() ||
        p.userId?.toString() === user._id?.toString(),
    );
    return participant?.progress || 0;
  };

  const isUserJoined = (challenge) => {
    if (!user || !challenge.participants) return false;
    return challenge.participants.some(
      (p) =>
        p.userId?._id?.toString() === user._id?.toString() ||
        p.userId?.toString() === user._id?.toString(),
    );
  };

  const joinChallenge = async (challengeId) => {
    if (!user) {
      showToast("Please log in to join challenges", "warning");
      navigate("/login");
      return;
    }

    try {
      const updatedChallenge = await ChallengeApi.joinChallenge(challengeId);
      showToast("Successfully joined challenge!", "success");
      // Reload challenges
      loadChallenges();
    } catch (error) {
      console.error("Failed to join challenge:", error);
      const errorMessage =
        error.message || "Failed to join challenge. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const leaveChallenge = async (challengeId) => {
    try {
      await ChallengeApi.leaveChallenge(challengeId);
      showToast("Left challenge successfully", "info");
      loadChallenges();
    } catch (error) {
      console.error("Failed to leave challenge:", error);
      showToast("Failed to leave challenge", "error");
    }
  };

  const updateProgress = async (challengeId, progress) => {
    try {
      await ChallengeApi.updateProgress(challengeId, progress);
      showToast("Progress updated!", "success");
      loadChallenges();
    } catch (error) {
      console.error("Failed to update progress:", error);
      showToast("Failed to update progress", "error");
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast("Please log in to create challenges", "warning");
      navigate("/login");
      return;
    }

    if (
      !newChallenge.title ||
      !newChallenge.description ||
      !newChallenge.deadline
    ) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      const challengeData = {
        title: newChallenge.title,
        description: newChallenge.description,
        deadline: newChallenge.deadline,
        duration: parseInt(newChallenge.duration) || 30,
        rewards: newChallenge.rewards
          ? newChallenge.rewards.split(",").map((r) => r.trim())
          : [],
        requirements: newChallenge.requirements
          ? newChallenge.requirements.split(",").map((r) => r.trim())
          : [],
        category: newChallenge.category,
      };

      await ChallengeApi.createChallenge(challengeData);
      showToast("Challenge created successfully!", "success");
      setShowCreateModal(false);
      setNewChallenge({
        title: "",
        description: "",
        deadline: "",
        duration: 30,
        rewards: "",
        requirements: "",
        category: "general",
      });
      loadChallenges();
    } catch (error) {
      console.error("Failed to create challenge:", error);
      const errorMessage =
        error.message || "Failed to create challenge. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const activeCount = challenges.filter((c) => c.status === "active").length;
  const completedCount = challenges.filter(
    (c) => c.status === "completed",
  ).length;
  const totalParticipants = challenges.reduce(
    (sum, c) => sum + (c.participants?.length || 0),
    0,
  );

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/feed")}
            className="text-amber-300 hover:text-amber-200 text-xl"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-amber-400">GlowChallenge</h1>
        </div>
        <button
          className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
          onClick={() => setShowCreateModal(true)}
        >
          Propose Challenge
        </button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-stone-950/95 via-stone-900/85 to-rose-950/20 p-6 sm:p-8 overflow-hidden relative shadow-[0_0_48px_rgba(251,113,133,0.1)]"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.14),_transparent_52%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300">
              <Sparkles className="w-5 h-5" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/55">
                Featured
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-100 via-amber-200 to-amber-400">
                Parallel Bloom: Future Paths
              </h2>
              <p className="text-amber-100/80 text-sm mt-2 max-w-xl leading-relaxed">
                See realistic future selves — day-in-the-life scenes, mirror questions, compare
                mode, and private Future Capsules. Built for emotional alignment, not pressure.
              </p>
            </div>
          </div>
          <Link
            to="/glowchallenge/parallel-bloom"
            className="inline-flex items-center justify-center shrink-0 px-6 py-3 rounded-full bg-gold-gradient text-black font-semibold text-sm hover:opacity-95 transition-opacity shadow-[0_0_28px_rgba(251,191,36,0.35)]"
          >
            Enter Parallel Bloom
          </Link>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {activeCount}
          </div>
          <div className="text-amber-200 text-sm">Active Challenges</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {completedCount}
          </div>
          <div className="text-amber-200 text-sm">Completed</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            {totalParticipants.toLocaleString()}
          </div>
          <div className="text-amber-200 text-sm">Total Participants</div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-amber-300">
          Community Challenges
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-amber-300">Loading challenges...</div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-card-bg backdrop-blur-sm rounded-xl p-12 border border-amber-500/30 text-center">
            <p className="text-amber-200 text-lg">
              No challenges found. Be the first to create one!
            </p>
          </div>
        ) : (
          challenges.map((challenge) => {
            const userProgress = getUserProgress(challenge);
            const joined = isUserJoined(challenge);
            const daysRemaining = getDaysRemaining(challenge.deadline);

            return (
              <div
                key={challenge._id || challenge.id}
                className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold mr-3 text-amber-300">
                        {challenge.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                          challenge.status,
                        )} text-black font-semibold`}
                      >
                        {challenge.status.charAt(0).toUpperCase() +
                          challenge.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-amber-200 mb-4">
                      {challenge.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        👥 {challenge.participants?.length || 0} participants
                      </span>
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        ⏳ {formatDate(challenge.deadline)}
                      </span>
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        {challenge.duration}{" "}
                        {challenge.duration === 1 ? "day" : "days"}
                      </span>
                      {daysRemaining > 0 && (
                        <span className="text-sm bg-red-500/20 px-2 py-1 rounded-full text-red-300">
                          {daysRemaining} days left
                        </span>
                      )}
                    </div>

                    {challenge.rewards && challenge.rewards.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 text-amber-300">
                          Rewards:
                        </h4>
                        <ul className="text-amber-200 space-y-1">
                          {challenge.rewards.map((reward, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-2">✓</span> {reward}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {challenge.status !== "completed" && (
                  <>
                    {joined && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-amber-200">Your Progress</span>
                          <span className="text-amber-200">
                            {userProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-800 rounded-full h-2">
                          <div
                            className="bg-gold-gradient h-2 rounded-full transition-all"
                            style={{ width: `${userProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-end mt-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={userProgress}
                            onChange={(e) =>
                              updateProgress(
                                challenge._id || challenge.id,
                                parseInt(e.target.value),
                              )
                            }
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      {joined ? (
                        <>
                          <button
                            className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-sm font-medium hover:bg-red-500/30 transition-colors text-red-300"
                            onClick={() =>
                              leaveChallenge(challenge._id || challenge.id)
                            }
                          >
                            Leave Challenge
                          </button>
                        </>
                      ) : challenge.status === "active" ? (
                        <button
                          className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black"
                          onClick={() =>
                            joinChallenge(challenge._id || challenge.id)
                          }
                        >
                          Join Challenge
                        </button>
                      ) : (
                        <button
                          className="px-4 py-2 bg-amber-400 rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black"
                          disabled
                        >
                          Starts Soon
                        </button>
                      )}
                    </div>
                  </>
                )}

                {challenge.status === "completed" && (
                  <div className="text-center py-4">
                    <span className="px-4 py-2 bg-amber-600 rounded-full text-sm font-medium text-black">
                      ✓ Challenge Completed
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Propose challenge — scrollable panel; Back / X / Esc / backdrop tap to exit */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="propose-challenge-title"
        >
          <div
            className="min-h-full flex items-start justify-center p-4 py-6 sm:py-10"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="relative flex w-full max-w-md max-h-[min(90vh,720px)] flex-col rounded-2xl border border-amber-500/30 bg-stone-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center gap-3 border-b border-amber-500/20 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-amber-300 hover:text-amber-200 text-sm font-medium shrink-0"
                >
                  ← Back
                </button>
                <h2
                  id="propose-challenge-title"
                  className="flex-1 text-center text-lg sm:text-xl font-bold text-amber-300 truncate"
                >
                  Propose Challenge
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="shrink-0 rounded-lg p-2 text-amber-400 hover:bg-stone-800 hover:text-amber-200"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">Title *</label>
                    <input
                      type="text"
                      value={newChallenge.title}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, title: e.target.value })
                      }
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">
                      Description *
                    </label>
                    <textarea
                      value={newChallenge.description}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows="4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">Deadline *</label>
                    <input
                      type="date"
                      value={newChallenge.deadline}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={newChallenge.duration}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          duration: parseInt(e.target.value, 10) || 30,
                        })
                      }
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">
                      Rewards (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newChallenge.rewards}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          rewards: e.target.value,
                        })
                      }
                      placeholder="Badge, 500 XP"
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2 text-sm">
                      Requirements (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newChallenge.requirements}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          requirements: e.target.value,
                        })
                      }
                      placeholder="Complete 5 tasks, Submit proof"
                      className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-3 pt-2 sticky bottom-0 bg-stone-900/95 pb-1 -mx-1 px-1 border-t border-amber-500/10 sm:border-0 sm:static sm:bg-transparent sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
                    >
                      Create Challenge
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlowChallenge;
