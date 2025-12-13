import React, { useState } from "react";

const GlowLogs = () => {
  const [logs, setLogs] = useState([
    {
      id: 1,
      title: "Completed React Fundamentals Course",
      date: "2023-06-15",
      duration: "8 hours",
      tags: ["React", "Frontend"],
      mood: "😊",
      reflection:
        "Learned the core concepts of React including components, props, and state. The hands-on exercises were particularly helpful.",
    },
    {
      id: 2,
      title: "Built My First Full-Stack Application",
      date: "2023-06-10",
      duration: "12 hours",
      tags: ["Node.js", "Express", "MongoDB"],
      mood: "🤩",
      reflection:
        "Successfully created a full-stack application with user authentication. Encountered some challenges with database connections but figured it out.",
    },
    {
      id: 3,
      title: "Started Learning TypeScript",
      date: "2023-06-05",
      duration: "4 hours",
      tags: ["TypeScript", "JavaScript"],
      mood: "🤔",
      reflection:
        "TypeScript seems complex at first but I can see how it would help with catching errors early. Need more practice with interfaces and generics.",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState({
    title: "",
    date: "",
    duration: "",
    tags: "",
    mood: "😊",
    reflection: "",
  });

  const handleAddLog = (e) => {
    e.preventDefault();
    if (newLog.title && newLog.date) {
      const log = {
        id: logs.length + 1,
        ...newLog,
        tags: newLog.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };
      setLogs([log, ...logs]);
      setNewLog({
        title: "",
        date: "",
        duration: "",
        tags: "",
        mood: "😊",
        reflection: "",
      });
      setShowForm(false);
    }
  };

  const moods = ["😊", "🤩", "🤔", "😴", "🤯", "🥳", "😎", "😤"];

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-400">GlowLogs</h1>
        <button
          className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center text-black"
          onClick={() => setShowForm(!showForm)}
        >
          <span className="mr-2">+</span> New Log
        </button>
      </div>

      {/* Add Log Form */}
      {showForm && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Create New Log
          </h2>
          <form onSubmit={handleAddLog}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-amber-200 mb-2">Title *</label>
                <input
                  type="text"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.title}
                  onChange={(e) =>
                    setNewLog({ ...newLog, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Date *</label>
                <input
                  type="date"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.date}
                  onChange={(e) =>
                    setNewLog({ ...newLog, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Duration</label>
                <input
                  type="text"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.duration}
                  onChange={(e) =>
                    setNewLog({ ...newLog, duration: e.target.value })
                  }
                  placeholder="e.g., 2 hours"
                />
              </div>
              <div>
                <label className="block text-amber-200 mb-2">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      className={`text-2xl w-12 h-12 rounded-full flex items-center justify-center ${
                        newLog.mood === mood ? "bg-amber-500" : "bg-stone-800"
                      } hover:bg-amber-500 transition-colors`}
                      onClick={() => setNewLog({ ...newLog, mood })}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Tags</label>
                <input
                  type="text"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={newLog.tags}
                  onChange={(e) =>
                    setNewLog({ ...newLog, tags: e.target.value })
                  }
                  placeholder="Separate with commas, e.g., React, JavaScript, Frontend"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-amber-200 mb-2">Reflection</label>
                <textarea
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="4"
                  value={newLog.reflection}
                  onChange={(e) =>
                    setNewLog({ ...newLog, reflection: e.target.value })
                  }
                  placeholder="What did you learn? What challenges did you face?"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              >
                Save Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient">
            {logs.length}
          </div>
          <div className="text-amber-200 text-sm">Total Logs</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient">
            12h
          </div>
          <div className="text-amber-200 text-sm">This Week</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient">
            5
          </div>
          <div className="text-amber-200 text-sm">Current Streak</div>
        </div>
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 text-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gold-gradient">
            8
          </div>
          <div className="text-amber-200 text-sm">Topics</div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-amber-300">Recent Logs</h2>
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-amber-300">{log.title}</h3>
              <div className="text-2xl">{log.mood}</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                📅 {log.date}
              </span>
              {log.duration && (
                <span className="text-sm bg-stone-800 px-2 py-1 rounded-full text-amber-200">
                  ⏱️ {log.duration}
                </span>
              )}
              {log.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm bg-amber-500/20 px-2 py-1 rounded-full text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-amber-200">{log.reflection}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlowLogs;
