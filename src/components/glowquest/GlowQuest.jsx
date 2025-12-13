import React, { useState, useEffect } from "react";
import CommentsApi from "../../api/commentsApi";

const GlowQuest = () => {
  const [quests, setQuests] = useState([
    {
      id: 1,
      title: "Build a React Todo App",
      description:
        "Create a fully functional todo application using React with hooks and state management.",
      difficulty: "Beginner",
      xp: 100,
      tags: ["React", "JavaScript", "Frontend"],
      deadline: "2023-07-01",
      status: "in-progress",
      progress: 75,
      // Peer support features
      supporters: ["Taylor Brown", "Jordan Lee"],
    },
    {
      id: 2,
      title: "Implement User Authentication",
      description:
        "Add user registration and login functionality to an existing application using JWT.",
      difficulty: "Intermediate",
      xp: 250,
      tags: ["Authentication", "Backend", "Security"],
      deadline: "2023-07-15",
      status: "not-started",
      progress: 0,
      supporters: [],
    },
    {
      id: 3,
      title: "Optimize Database Queries",
      description:
        "Improve the performance of slow database queries in a production application.",
      difficulty: "Advanced",
      xp: 500,
      tags: ["Database", "Performance", "Backend"],
      deadline: "2023-07-30",
      status: "completed",
      progress: 100,
      supporters: ["Alex Johnson", "Sam Smith", "Taylor Brown"],
    },
    {
      id: 4,
      title: "Create a Responsive Dashboard",
      description:
        "Design and implement a responsive admin dashboard with charts and data visualization.",
      difficulty: "Intermediate",
      xp: 300,
      tags: ["UI/UX", "Frontend", "Design"],
      deadline: "2023-07-20",
      status: "not-started",
      progress: 0,
      supporters: ["Jordan Lee"],
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [newComment, setNewComment] = useState({});
  const [supportingQuest, setSupportingQuest] = useState(null);

  // Comments state
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});

  // Load comments for all quests on component mount
  useEffect(() => {
    const loadComments = async () => {
      for (const quest of quests) {
        try {
          const questComments = await CommentsApi.getGlowQuestComments(
            quest.id
          );
          setComments((prev) => ({
            ...prev,
            [quest.id]: questComments,
          }));
        } catch (error) {
          console.error(
            `Failed to load comments for quest ${quest.id}:`,
            error
          );
        }
      }
    };

    loadComments();
  }, []);

  const filteredQuests =
    filter === "all"
      ? quests
      : quests.filter(
          (quest) =>
            quest.status === filter || quest.difficulty.toLowerCase() === filter
        );

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

  const handleStartQuest = (id) => {
    setQuests(
      quests.map((quest) =>
        quest.id === id
          ? { ...quest, status: "in-progress", progress: 10 }
          : quest
      )
    );
  };

  const handleCompleteQuest = (id) => {
    setQuests(
      quests.map((quest) =>
        quest.id === id
          ? { ...quest, status: "completed", progress: 100 }
          : quest
      )
    );
  };

  const handleProgressUpdate = (id, progress) => {
    setQuests(
      quests.map((quest) =>
        quest.id === id
          ? { ...quest, progress: Math.min(100, Math.max(0, progress)) }
          : quest
      )
    );
  };

  const handleAddComment = async (questId) => {
    const commentText = newComment[questId];
    if (commentText && commentText.trim()) {
      try {
        const comment = await CommentsApi.addGlowQuestComment(questId, {
          username: "You",
          text: commentText,
        });

        // Update comments state
        setComments((prev) => ({
          ...prev,
          [questId]: [...(prev[questId] || []), comment],
        }));

        // Clear comment input
        setNewComment((prev) => ({
          ...prev,
          [questId]: "",
        }));
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    }
  };

  const handleSupportQuest = (questId) => {
    setQuests(
      quests.map((quest) => {
        if (quest.id === questId && !quest.supporters.includes("You")) {
          return {
            ...quest,
            supporters: [...quest.supporters, "You"],
          };
        }
        return quest;
      })
    );
    setSupportingQuest(questId);
  };

  const handleUnsupportQuest = (questId) => {
    setQuests(
      quests.map((quest) => {
        if (quest.id === questId && quest.supporters.includes("You")) {
          return {
            ...quest,
            supporters: quest.supporters.filter(
              (supporter) => supporter !== "You"
            ),
          };
        }
        return quest;
      })
    );
    setSupportingQuest(null);
  };

  const toggleComments = (questId) => {
    setShowComments((prev) => ({
      ...prev,
      [questId]: !prev[questId],
    }));
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

      {/* New Quest Form */}
      {showNewQuest && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Create New Quest
          </h2>
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-amber-200 mb-2">Quest Title</label>
                <input
                  type="text"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Build a REST API with Express"
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Difficulty</label>
                <select className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-amber-200 mb-2">XP Reward</label>
                <input
                  type="number"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., 150"
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Deadline</label>
                <input
                  type="date"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Description</label>
                <textarea
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="3"
                  placeholder="Describe the quest objectives and requirements"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Tags</label>
                <input
                  type="text"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Separate with commas, e.g., React, JavaScript, Frontend"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                onClick={() => setShowNewQuest(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              >
                Create Quest
              </button>
            </div>
          </form>
        </div>
      )}

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
          All Quests
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "not-started"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("not-started")}
        >
          Available
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "in-progress"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("in-progress")}
        >
          In Progress
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "completed"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "beginner"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("beginner")}
        >
          Beginner
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "intermediate"
              ? "bg-amber-400/20 text-amber-200 border border-amber-500/30"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("intermediate")}
        >
          Intermediate
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "advanced"
              ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("advanced")}
        >
          Advanced
        </button>
      </div>

      {/* Quests List */}
      <div className="space-y-6">
        {filteredQuests.map((quest) => (
          <div
            key={quest.id}
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
                    ⏳ Due {quest.deadline}
                  </span>
                  {quest.tags.map((tag, index) => (
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
                  quest.status
                )} text-black font-semibold`}
              >
                {quest.status.replace("-", " ")}
              </span>
            </div>

            {/* Progress and Supporters */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-200">Progress</span>
                <span className="text-amber-200">{quest.progress}%</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2">
                <div
                  className="bg-gold-gradient h-2 rounded-full"
                  style={{ width: `${quest.progress}%` }}
                ></div>
              </div>

              {/* Progress Controls for In-Progress Quests */}
              {quest.status === "in-progress" && (
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() =>
                      handleProgressUpdate(quest.id, quest.progress - 10)
                    }
                    className="w-8 h-8 rounded-full bg-stone-700 text-amber-300 flex items-center justify-center"
                    disabled={quest.progress <= 0}
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={quest.progress}
                    onChange={(e) =>
                      handleProgressUpdate(quest.id, parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                  <button
                    onClick={() =>
                      handleProgressUpdate(quest.id, quest.progress + 10)
                    }
                    className="w-8 h-8 rounded-full bg-stone-700 text-amber-300 flex items-center justify-center"
                    disabled={quest.progress >= 100}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Supporters */}
            {quest.supporters.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-amber-200 mb-2">
                  Supported by: {quest.supporters.join(", ")}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mb-4">
              <button
                className="text-amber-300 font-semibold mb-2 flex items-center"
                onClick={() => toggleComments(quest.id)}
              >
                <span>💬 Community Support</span>
                <span className="ml-2 text-amber-400/70 text-sm">
                  ({comments[quest.id] ? comments[quest.id].length : 0}{" "}
                  comments)
                </span>
              </button>

              {showComments[quest.id] && (
                <div className="bg-stone-800/50 rounded-lg p-4 mt-2">
                  {/* Existing Comments */}
                  {comments[quest.id] && comments[quest.id].length > 0 ? (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                      {comments[quest.id].map((comment) => (
                        <div key={comment.id} className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold mr-2 mt-1">
                            {comment.username.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="bg-stone-700 rounded-lg p-3">
                              <div className="flex justify-between">
                                <span className="font-medium text-amber-300 text-sm">
                                  {comment.username}
                                </span>
                                <span className="text-amber-400 text-xs">
                                  {new Date(
                                    comment.timestamp
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

                  {/* Add Comment Form */}
                  <div className="flex mt-3">
                    <input
                      type="text"
                      value={newComment[quest.id] || ""}
                      onChange={(e) =>
                        setNewComment({
                          ...newComment,
                          [quest.id]: e.target.value,
                        })
                      }
                      placeholder="Add a comment to support..."
                      className="flex-1 bg-stone-700 border border-amber-500/30 rounded-l-lg p-2 text-amber-200 placeholder-amber-400 focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(quest.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(quest.id)}
                      className="bg-amber-500 text-black px-4 rounded-r-lg font-medium disabled:opacity-50"
                      disabled={
                        !newComment[quest.id] || !newComment[quest.id].trim()
                      }
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              {quest.status === "not-started" && (
                <button
                  className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black"
                  onClick={() => handleStartQuest(quest.id)}
                >
                  Start Quest
                </button>
              )}
              {quest.status === "in-progress" && (
                <>
                  <button
                    onClick={() =>
                      supportingQuest === quest.id
                        ? handleUnsupportQuest(quest.id)
                        : handleSupportQuest(quest.id)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-opacity ${
                      supportingQuest === quest.id
                        ? "bg-amber-500 text-black"
                        : "bg-stone-700 text-amber-300 hover:bg-stone-600"
                    }`}
                  >
                    {supportingQuest === quest.id
                      ? "❤️ Supporting"
                      : "🤍 Support"}
                  </button>
                  <button
                    className="px-4 py-2 bg-gold-gradient rounded-full text-sm font-medium hover:opacity-90 transition-opacity text-black"
                    onClick={() => handleCompleteQuest(quest.id)}
                  >
                    Complete Quest
                  </button>
                </>
              )}
              {quest.status === "completed" && (
                <button
                  className="px-4 py-2 bg-amber-500 rounded-full text-sm font-medium text-black"
                  disabled
                >
                  ✓ Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            3
          </div>
          <div className="text-amber-200">Active Quests</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            1
          </div>
          <div className="text-amber-200">Completed Today</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            850
          </div>
          <div className="text-amber-200">Total XP</div>
        </div>
      </div>
    </div>
  );
};

export default GlowQuest;
