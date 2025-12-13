import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Echoes = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      title: "Best practices for React state management",
      author: "AlexJohnson",
      replies: 24,
      views: 128,
      lastActivity: "2 hours ago",
      tags: ["React", "State Management"],
    },
    {
      id: 2,
      title: "How to optimize performance in large applications",
      author: "SamSmith",
      replies: 18,
      views: 96,
      lastActivity: "5 hours ago",
      tags: ["Performance", "Optimization"],
    },
    {
      id: 3,
      title: "UI/UX design trends for 2023",
      author: "TaylorBrown",
      replies: 32,
      views: 210,
      lastActivity: "1 day ago",
      tags: ["Design", "UI/UX"],
    },
    {
      id: 4,
      title: "Getting started with TypeScript in React",
      author: "JordanLee",
      replies: 15,
      views: 87,
      lastActivity: "1 day ago",
      tags: ["TypeScript", "React"],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // Get all unique tags
  const allTags = [...new Set(discussions.flatMap((d) => d.tags))];

  // Filter discussions based on search and tag
  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discussion.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag =
      selectedTag === "" || discussion.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/feed")}
          className="text-amber-300 hover:text-amber-200 text-xl mr-4"
        >
          ←
        </button>
        <h1 className="text-3xl font-bold text-amber-300">Echoes</h1>
      </div>

      {/* Search and Filter */}
      <div className="bg-card-bg rounded-xl p-6 border border-amber-500/30 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-amber-300">Popular Tags:</span>
          {allTags.slice(0, 5).map((tag) => (
            <button
              key={tag}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTag === tag ? "bg-amber-600" : "bg-amber-800"
              } hover:bg-amber-600 transition-colors`}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.map((discussion) => (
          <div
            key={discussion.id}
            className="bg-card-bg rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold hover:text-amber-300 transition-colors text-amber-200">
                {discussion.title}
              </h3>
              <span className="text-xs bg-amber-700 px-2 py-1 rounded-full text-amber-200">
                Hot
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-amber-900/50 px-2 py-1 rounded-full text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-between text-sm text-amber-300">
              <div>
                <span>By {discussion.author}</span>
              </div>
              <div className="flex space-x-4">
                <span>{discussion.replies} replies</span>
                <span>{discussion.views} views</span>
                <span>Last activity {discussion.lastActivity}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredDiscussions.length === 0 && (
          <div className="bg-card-bg rounded-xl p-12 border border-amber-500/30 text-center">
            <p className="text-amber-200 text-lg">
              No discussions found matching your criteria.
            </p>
            <button
              className="mt-4 bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
              onClick={() => {
                setSearchTerm("");
                setSelectedTag("");
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Start Discussion Button */}
      <div className="mt-8 text-center">
        <button className="bg-gold-gradient px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity">
          Start a New Discussion
        </button>
      </div>
    </div>
  );
};

export default Echoes;
