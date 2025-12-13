import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Pulse = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([
    {
      id: 1,
      user: "AlexJohnson",
      action: "completed",
      item: "React Fundamentals Course",
      time: "10 minutes ago",
      type: "achievement",
    },
    {
      id: 2,
      user: "SamSmith",
      action: "started a new",
      item: "discussion: Best practices for React state management",
      time: "25 minutes ago",
      type: "discussion",
    },
    {
      id: 3,
      user: "TaylorBrown",
      action: "shared a",
      item: "resource: UI/UX Design Principles Handbook",
      time: "1 hour ago",
      type: "resource",
    },
    {
      id: 4,
      user: "JordanLee",
      action: "joined the",
      item: "community",
      time: "2 hours ago",
      type: "community",
    },
    {
      id: 5,
      user: "CaseyWilliams",
      action: "earned the",
      item: '"JavaScript Master" badge',
      time: "3 hours ago",
      type: "badge",
    },
    {
      id: 6,
      user: "RileyDavis",
      action: "posted in",
      item: "General Discussion: How to stay motivated while learning to code?",
      time: "5 hours ago",
      type: "post",
    },
  ]);

  const [filter, setFilter] = useState("all");

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((activity) => activity.type === filter);

  const getTypeIcon = (type) => {
    switch (type) {
      case "achievement":
        return "🏆";
      case "discussion":
        return "💬";
      case "resource":
        return "📚";
      case "community":
        return "👥";
      case "badge":
        return "🥇";
      case "post":
        return "📝";
      default:
        return "✨";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "achievement":
        return "from-amber-600 to-yellow-600";
      case "discussion":
        return "from-amber-500 to-amber-300";
      case "resource":
        return "from-amber-400 to-amber-200";
      case "community":
        return "from-amber-600 to-amber-500";
      case "badge":
        return "from-amber-500 to-yellow-600";
      case "post":
        return "from-amber-400 to-amber-600";
      default:
        return "from-amber-600 to-yellow-600";
    }
  };

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

      {/* Activity Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "all"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("all")}
        >
          All Activities
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "achievement"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("achievement")}
        >
          Achievements
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "discussion"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("discussion")}
        >
          Discussions
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            filter === "resource"
              ? "bg-gold-gradient text-black font-semibold"
              : "bg-card-bg border border-amber-500/30 text-amber-200"
          } hover:opacity-90 transition-all`}
          onClick={() => setFilter("resource")}
        >
          Resources
        </button>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
          >
            <div className="flex items-start">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-r ${getTypeColor(
                  activity.type
                )} flex items-center justify-center text-black text-xl mr-4`}
              >
                {getTypeIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-lg">
                  <span className="font-bold text-amber-300">
                    {activity.user}
                  </span>
                  <span className="text-amber-200"> {activity.action} </span>
                  <span className="font-medium text-amber-300">
                    {activity.item}
                  </span>
                </p>
                <p className="text-gray-300 text-sm mt-1">{activity.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            1,248
          </div>
          <div className="text-amber-200">Active Members</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            342
          </div>
          <div className="text-amber-200">New This Week</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 text-center">
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gold-gradient mb-2">
            12.4k
          </div>
          <div className="text-amber-200">Total Posts</div>
        </div>
      </div>
    </div>
  );
};

export default Pulse;
