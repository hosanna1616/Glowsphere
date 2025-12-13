import React, { useState, useRef, useEffect } from "react";
import CommentsApi from "../../api/commentsApi";
import apiClient from "../../api/apiClient";

const Feed = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      username: "AlexJohnson",
      avatar: "A",
      content:
        "Just completed the React course! Feeling excited to build my first project.",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 5,
      category: "career_tip",
      isVideo: false,
      imageUrl: null,
      tags: ["react", "learning"],
    },
    {
      id: 2,
      username: "SamSmith",
      avatar: "S",
      content:
        "Working on a new UI design for my portfolio. Love the creative process!",
      timestamp: "5 hours ago",
      likes: 18,
      comments: 3,
      category: "creativity",
      isVideo: true,
      videoUrl:
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl: "https://placehold.co/400x300/1c1917/FFFFFF?text=UI+Design",
      tags: ["design", "portfolio"],
    },
    {
      id: 3,
      username: "TaylorBrown",
      avatar: "T",
      content:
        "Anyone else struggling with state management in large React apps? Would love some tips.",
      timestamp: "1 day ago",
      likes: 32,
      comments: 12,
      category: "question",
      isVideo: false,
      imageUrl: null,
      tags: ["react", "state-management"],
    },
    {
      id: 4,
      username: "JordanLee",
      avatar: "J",
      content:
        "Quick tip: Use React.memo to optimize your components and prevent unnecessary re-renders!",
      timestamp: "1 day ago",
      likes: 42,
      comments: 7,
      category: "tip",
      isVideo: true,
      videoUrl:
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl:
        "https://placehold.co/400x300/1c1917/FFFFFF?text=React+Tips",
      tags: ["react", "optimization"],
    },
  ]);

  const [newPost, setNewPost] = useState({
    content: "",
    isVideo: false,
    mediaFile: null,
    tags: "",
  });

  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Comments state
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});

  // Load comments for all posts on component mount
  useEffect(() => {
    const loadComments = async () => {
      for (const post of posts) {
        try {
          // Skip loading comments for demo posts
          if (post.id <= 4) continue;

          const postComments = await CommentsApi.getComments(post.id);
          setComments((prev) => ({
            ...prev,
            [post.id]: postComments,
          }));
        } catch (error) {
          console.error(`Failed to load comments for post ${post.id}:`, error);
        }
      }
    };

    loadComments();
  }, []);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPost({
        ...newPost,
        mediaFile: file,
        isVideo: file.type.startsWith("video/"),
      });

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (newPost.content.trim() || newPost.mediaFile) {
      const post = {
        id: Date.now(), // Use timestamp as ID for new posts
        username: "You",
        avatar: "Y",
        content: newPost.content,
        timestamp: "Just now",
        likes: 0,
        comments: 0,
        category: "general",
        isVideo: newPost.isVideo,
        imageUrl: !newPost.isVideo && previewUrl ? previewUrl : null,
        videoUrl: newPost.isVideo && previewUrl ? previewUrl : null,
        thumbnailUrl: newPost.isVideo && previewUrl ? previewUrl : null,
        tags: newPost.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };
      setPosts([post, ...posts]);
      setNewPost({
        content: "",
        isVideo: false,
        mediaFile: null,
        tags: "",
      });
      setPreviewUrl(null);
      setShowVideoUpload(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (commentText && commentText.trim()) {
      try {
        // Send comment to API
        const token = apiClient.getToken();
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(
          `${apiClient.getApiBaseUrl()}/posts/${postId}/comments`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ text: commentText }),
          }
        );

        if (!response.ok) {
          // If backend is not available, create comment in state as fallback
          if (
            response.status === 500 ||
            response.status === 503 ||
            response.status === 0
          ) {
            // Create mock comment
            const mockComment = {
              id: Date.now(),
              username: "You",
              text: commentText,
              avatar: "Y",
              timestamp: new Date().toISOString(),
            };

            // Update comments state
            setComments((prev) => ({
              ...prev,
              [postId]: [...(prev[postId] || []), mockComment],
            }));

            // Update post comment count
            setPosts(
              posts.map((post) =>
                post.id === postId
                  ? { ...post, comments: post.comments + 1 }
                  : post
              )
            );

            // Clear comment input
            setNewComment((prev) => ({
              ...prev,
              [postId]: "",
            }));

            alert("Comment added in offline mode.");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const comment = await response.json();

        // Update comments state
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment],
        }));

        // Update post comment count
        setPosts(
          posts.map((post) =>
            post.id === postId ? { ...post, comments: post.comments + 1 } : post
          )
        );

        // Clear comment input
        setNewComment((prev) => ({
          ...prev,
          [postId]: "",
        }));
      } catch (error) {
        // Fallback to localStorage if network error
        if (error instanceof TypeError && error.message.includes("fetch")) {
          try {
            // Create mock comment
            const mockComment = {
              id: Date.now(),
              username: "You",
              text: commentText,
              avatar: "Y",
              timestamp: new Date().toISOString(),
            };

            // Update comments state
            setComments((prev) => ({
              ...prev,
              [postId]: [...(prev[postId] || []), mockComment],
            }));

            // Update post comment count
            setPosts(
              posts.map((post) =>
                post.id === postId
                  ? { ...post, comments: post.comments + 1 }
                  : post
              )
            );

            // Clear comment input
            setNewComment((prev) => ({
              ...prev,
              [postId]: "",
            }));

            alert("Comment added in offline mode.");
            return;
          } catch (storageError) {
            console.error(
              "Failed to add comment in localStorage:",
              storageError
            );
          }
        }
        console.error("Failed to add comment:", error);
        alert("Failed to add comment. Please try again.");
      }
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleShare = async (postId) => {
    try {
      // Copy post link to clipboard
      const postUrl = `${window.location.origin}/feed/post/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      alert("Failed to copy link. Please try again.");
    }
  };

  const handleSave = async (postId) => {
    try {
      // Send save request to API
      const token = apiClient.getToken();
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(
        `${apiClient.getApiBaseUrl()}/posts/${postId}/save`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        // If backend is not available, save in localStorage as fallback
        if (
          response.status === 500 ||
          response.status === 503 ||
          response.status === 0
        ) {
          // Save in localStorage
          const savedPosts = JSON.parse(
            localStorage.getItem("savedPosts") || "[]"
          );
          if (!savedPosts.includes(postId)) {
            savedPosts.push(postId);
            localStorage.setItem("savedPosts", JSON.stringify(savedPosts));
            alert("Post saved to your bookmarks (offline mode)!");
            return;
          } else {
            alert("Post is already saved!");
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("Post saved to your bookmarks!");
    } catch (error) {
      // Fallback to localStorage if network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        try {
          // Save in localStorage
          const savedPosts = JSON.parse(
            localStorage.getItem("savedPosts") || "[]"
          );
          if (!savedPosts.includes(postId)) {
            savedPosts.push(postId);
            localStorage.setItem("savedPosts", JSON.stringify(savedPosts));
            alert("Post saved to your bookmarks (offline mode)!");
            return;
          } else {
            alert("Post is already saved!");
            return;
          }
        } catch (storageError) {
          console.error("Failed to save post in localStorage:", storageError);
        }
      }
      console.error("Failed to save post:", error);
      alert("Failed to save post. Please try again.");
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6 text-amber-300">Community Feed</h1>

      {/* Post Creation */}
      <div className="bg-card-bg rounded-xl p-6 border border-amber-500/30 mb-8">
        <div className="flex space-x-4 mb-4">
          <button
            className={`flex-1 py-2 rounded-lg ${
              !showVideoUpload
                ? "bg-amber-500/20 text-amber-300"
                : "bg-stone-800 text-amber-400"
            }`}
            onClick={() => setShowVideoUpload(false)}
          >
            Text Post
          </button>
          <button
            className={`flex-1 py-2 rounded-lg ${
              showVideoUpload
                ? "bg-amber-500/20 text-amber-300"
                : "bg-stone-800 text-amber-400"
            }`}
            onClick={() => setShowVideoUpload(true)}
          >
            Media Post
          </button>
        </div>

        <form onSubmit={handlePostSubmit}>
          {!showVideoUpload ? (
            <>
              <textarea
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
                placeholder="Share your thoughts with the community..."
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-4 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                rows="3"
              />
            </>
          ) : (
            <>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full bg-stone-800 border-2 border-dashed border-amber-500/30 rounded-lg h-48 flex flex-col items-center justify-center mb-4 hover:bg-stone-700 transition-colors"
                >
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      {newPost.isVideo ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <video
                            src={previewUrl}
                            className="max-h-full max-w-full object-contain"
                            controls
                          />
                        </div>
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-amber-300">Upload a photo or video</p>
                      <p className="text-amber-400 text-sm mt-1">
                        Click to browse files
                      </p>
                    </div>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>
              <textarea
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
                placeholder="Add a caption..."
                className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-4 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                rows="2"
              />
            </>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={newPost.tags}
              onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              placeholder="Add tags (comma separated)"
              className="w-full bg-secondary-bg border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-amber-300 text-sm">
              <span>Share your ideas, questions, or updates</span>
            </div>
            <button
              type="submit"
              className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
              disabled={!newPost.content.trim() && !newPost.mediaFile}
            >
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-card-bg rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
          >
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold mr-4">
                {post.avatar}
              </div>
              <div>
                <h3 className="font-bold text-amber-300">{post.username}</h3>
                <p className="text-amber-400 text-sm">{post.timestamp}</p>
              </div>
            </div>

            {post.isVideo ? (
              <div className="mb-4">
                <div className="bg-stone-800 rounded-lg overflow-hidden mb-3 relative">
                  {post.videoUrl ? (
                    <video
                      src={post.videoUrl}
                      className="w-full h-64 object-cover"
                      controls
                    />
                  ) : (
                    <>
                      <img
                        src={post.thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="text-3xl text-white">▶️</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-amber-200 mb-3">{post.content}</p>
              </div>
            ) : post.imageUrl ? (
              <div className="mb-4">
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <p className="text-amber-200 mt-3">{post.content}</p>
              </div>
            ) : (
              <p className="text-amber-200 mb-4">{post.content}</p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex space-x-6 text-amber-300 mb-4">
              <button
                className="flex items-center space-x-1 hover:text-amber-200 transition-colors"
                onClick={() => handleLike(post.id)}
              >
                <span>❤️</span>
                <span>{post.likes}</span>
              </button>
              <button
                className="flex items-center space-x-1 hover:text-amber-200 transition-colors"
                onClick={() => toggleComments(post.id)}
              >
                <span>💬</span>
                <span>{post.comments}</span>
              </button>
              <button
                className="flex items-center space-x-1 hover:text-amber-200 transition-colors"
                onClick={() => handleShare(post.id)}
              >
                <span>↗️</span>
                <span>Share</span>
              </button>
              <button
                className="flex items-center space-x-1 hover:text-amber-200 transition-colors"
                onClick={() => handleSave(post.id)}
              >
                <span>🔖</span>
                <span>Save</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="mt-4 pt-4 border-t border-amber-500/20">
                {/* Existing Comments */}
                {comments[post.id] && comments[post.id].length > 0 && (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments[post.id].map((comment) => (
                      <div key={comment.id} className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold mr-2 mt-1">
                          {comment.avatar || comment.username.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-stone-800 rounded-lg p-3">
                            <div className="flex justify-between">
                              <span className="font-medium text-amber-300 text-sm">
                                {comment.username}
                              </span>
                              <span className="text-amber-400 text-xs">
                                {new Date(comment.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                            <p className="text-amber-200 text-sm mt-1">
                              {comment.text}
                            </p>
                          </div>
                          <div className="flex items-center mt-1 text-amber-400 text-xs">
                            <button className="hover:text-amber-300">
                              Like
                            </button>
                            <span className="mx-2">•</span>
                            <button className="hover:text-amber-300">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-black text-xs font-bold mr-2 mt-1">
                    Y
                  </div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a comment..."
                      className="flex-1 bg-stone-800 border border-amber-500/30 rounded-l-lg p-2 text-amber-200 placeholder-amber-400 focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <button
                      className="bg-amber-500 text-black px-4 rounded-r-lg font-medium disabled:opacity-50"
                      onClick={() => handleAddComment(post.id)}
                      disabled={
                        !newComment[post.id] || !newComment[post.id].trim()
                      }
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
