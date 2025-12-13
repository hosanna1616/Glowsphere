import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ChallengeApi from "../../api/challengeApi";

const GlowChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
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

  // Load challenges on mount
  useEffect(() => {
    loadChallenges();
  }, [filter]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const status = filter === "all" ? null : filter;
      const challengeData = await ChallengeApi.getChallenges(status);
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
      (p) => p.userId?._id?.toString() === user._id?.toString() || 
             p.userId?.toString() === user._id?.toString()
    );
    return participant?.progress || 0;
  };

  const isUserJoined = (challenge) => {
    if (!user || !challenge.participants) return false;
    return challenge.participants.some(
      (p) => p.userId?._id?.toString() === user._id?.toString() || 
             p.userId?.toString() === user._id?.toString()
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
      const errorMessage = error.message || "Failed to join challenge. Please try again.";
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

    if (!newChallenge.title || !newChallenge.description || !newChallenge.deadline) {
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
      const errorMessage = error.message || "Failed to create challenge. Please try again.";
      showToast(errorMessage, "error");
    }
  };

  const filteredChallenges =
    filter === "all"
      ? challenges
      : challenges.filter((challenge) => challenge.status === filter);

  const activeCount = challenges.filter((c) => c.status === "active").length;
  const completedCount = challenges.filter((c) => c.status === "completed").length;
  const totalParticipants = challenges.reduce(
    (sum, c) => sum + (c.participants?.length || 0),
    0
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "all"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("all")}
        >
          All Challenges
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "active"
              ? "bg-amber-500 text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "upcoming"
              ? "bg-amber-400 text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "completed"
              ? "bg-amber-600 text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

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
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-card-bg backdrop-blur-sm rounded-xl p-12 border border-amber-500/30 text-center">
            <p className="text-amber-200 text-lg">
              No challenges found. Be the first to create one!
            </p>
          </div>
        ) : (
          filteredChallenges.map((challenge) => {
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
                          challenge.status
                        )} text-black font-semibold`}
                      >
                        {challenge.status.charAt(0).toUpperCase() +
                          challenge.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-amber-200 mb-4">{challenge.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        👥 {challenge.participants?.length || 0} participants
                      </span>
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        ⏳ {formatDate(challenge.deadline)}
                      </span>
                      <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                        {challenge.duration} {challenge.duration === 1 ? "day" : "days"}
                      </span>
                      {daysRemaining > 0 && (
                        <span className="text-sm bg-red-500/20 px-2 py-1 rounded-full text-red-300">
                          {daysRemaining} days left
                        </span>
                      )}
                    </div>

                    {challenge.rewards && challenge.rewards.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold mb-2 text-amber-300">Rewards:</h4>
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
                          <span className="text-amber-200">{userProgress}%</span>
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
                              updateProgress(challenge._id || challenge.id, parseInt(e.target.value))
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
                            onClick={() => leaveChallenge(challenge._id || challenge.id)}
                          >
                            Leave Challenge
                          </button>
                        </>
                      ) : challenge.status === "active" ? (
                        <button
                          className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black"
                          onClick={() => joinChallenge(challenge._id || challenge.id)}
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

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Create New Challenge
            </h2>
            <form onSubmit={handleCreateChallenge}>
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">Title *</label>
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
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">Description *</label>
                <textarea
                  value={newChallenge.description}
                  onChange={(e) =>
                    setNewChallenge({
                      ...newChallenge,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="3"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">Deadline *</label>
                <input
                  type="date"
                  value={newChallenge.deadline}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, deadline: e.target.value })
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={newChallenge.duration}
                  onChange={(e) =>
                    setNewChallenge({
                      ...newChallenge,
                      duration: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">
                  Rewards (comma-separated)
                </label>
                <input
                  type="text"
                  value={newChallenge.rewards}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, rewards: e.target.value })
                  }
                  placeholder="🏅 Badge, 🔥 500 XP"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-amber-200 mb-2">
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
              <div className="flex justify-end space-x-3">
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
      )}
    </div>
  );
};

export default GlowChallenge;
