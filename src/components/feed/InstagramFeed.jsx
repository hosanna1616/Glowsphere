import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PostsApi from "../../api/postsApi";

const InstagramFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [backendError, setBackendError] = useState(false);

  const [stories, setStories] = useState([]);

  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showComments, setShowComments] = useState({});
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostPost, setRepostPost] = useState(null);
  const [repostComment, setRepostComment] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [heartAnimations, setHeartAnimations] = useState({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [newPostPreview, setNewPostPreview] = useState(null);
  const feedRef = useRef(null);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get user's avatar initial
  const getUserAvatar = (username) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  // Format timestamp
  const formatTimestamp = (date) => {
    if (!date) return "";
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postDate.toLocaleDateString();
  };

  // Load posts from API
  const loadPosts = async (page = 1, append = false) => {
    try {
      setLoading(true);
      setBackendError(false); // Reset backend error state when attempting to load
      const response = await PostsApi.getPosts(page);
      
      if (!response || !response.posts) {
        throw new Error("Invalid response from server");
      }
      
      const formattedPosts = response.posts.map((post) => ({
        id: post._id,
        username: post.username,
        avatar: getUserAvatar(post.username),
        imageUrl: post.mediaUrl || null,
        caption: post.content,
        timestamp: formatTimestamp(post.createdAt),
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
        isLiked: post.likes?.some(
          (like) => like.userId?.toString() === user?._id?.toString()
        ) || false,
        isSaved: post.savedBy?.some(
          (save) => save.userId?.toString() === user?._id?.toString()
        ) || false,
        mediaType: post.mediaType || "image",
        commentsList: post.comments || [],
        createdAt: post.createdAt,
      }));

      if (append) {
        setPosts((prev) => [...prev, ...formattedPosts]);
      } else {
        setPosts(formattedPosts);
      }
      
      // Initialize comments from loaded posts - ensure they persist after refresh
      formattedPosts.forEach((post) => {
        if (post.commentsList && post.commentsList.length > 0) {
          setComments((prev) => ({
            ...prev,
            [post.id]: post.commentsList.map((comment) => ({
              id: comment._id || comment.id,
              _id: comment._id || comment.id,
              username: comment.username,
              text: comment.text,
              timestamp: comment.timestamp || comment.createdAt,
              avatar: comment.username?.charAt(0) || "U",
              likes: comment.likes || [],
            })),
          }));
        }
      });

      setHasMore(page < response.pages);
      setCurrentPage(page);
      setBackendError(false); // Clear error on success
    } catch (error) {
      console.error("Failed to load posts:", error);
      const errorMessage = error.message || "Failed to fetch posts";
      
      // Track backend connection errors
      const isConnectionError = errorMessage.includes("connect to server") || 
                                errorMessage.includes("Failed to fetch") ||
                                errorMessage.includes("NetworkError");
      
      if (isConnectionError) {
        setBackendError(true);
      } else {
        setBackendError(false);
        // Only show toast for non-connection errors to avoid spam
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          showToast("Please log in again", "error");
          navigate("/login");
        } else if (!errorMessage.includes("network")) {
          showToast(errorMessage, "error");
        }
      }

      // Keep existing posts on error
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPosts(1, false);
  }, []);

  // Reset backend error when posts load successfully
  useEffect(() => {
    if (posts.length > 0) {
      setBackendError(false);
    }
  }, [posts]);

  // Check if user liked a post
  const isPostLiked = (post) => {
    return post.isLiked || false;
  };

  // Double tap to like
  const handleDoubleTap = (postId) => {
    if (!posts.find((p) => p.id === postId)?.isLiked) {
      handleLike(postId);
      // Show heart animation
      setHeartAnimations((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setHeartAnimations((prev) => ({ ...prev, [postId]: false }));
      }, 1000);
    }
  };

  // Pull to refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (isPulling && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      await loadPosts(1, false);
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // Handle media file selection
  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      showToast("Please log in to create a post", "warning");
      navigate("/login");
      return;
    }

    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please log in to create a post", "warning");
      navigate("/login");
      return;
    }

    if (!newPostContent.trim() && !newPostMedia) {
      showToast("Please add content or media to your post", "warning");
      return;
    }

    try {
      const tags = newPostContent.match(/#\w+/g) || [];
      const postData = {
        content: newPostContent.trim() || "Shared a photo",
        tags: tags.map((tag) => tag.substring(1)),
        category: "general",
      };
      
      await PostsApi.createPost(postData, newPostMedia);

      setNewPostContent("");
      setNewPostMedia(null);
      setNewPostPreview(null);
      setShowCreatePost(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Reload posts
      showToast("Post created successfully!", "success");
      loadPosts(1, false);
    } catch (error) {
      console.error("Failed to create post:", error);
      const errorMessage = error.message || "Failed to create post. Please try again.";
      
      // Handle authentication errors
      if (errorMessage.includes("Authentication required") || errorMessage.includes("401")) {
        showToast("Please log in again", "error");
        navigate("/login");
      } else {
        showToast(errorMessage, "error");
      }
    }
  };

  // Load posts on mount
  useEffect(() => {
    loadPosts(1, false);
  }, []);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPostRef.current) {
      observer.observe(lastPostRef.current);
    }

    return () => {
      if (lastPostRef.current) {
        observer.unobserve(lastPostRef.current);
      }
    };
  }, [posts, hasMore, loading, currentPage]);

  const handleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    const wasLiked = post.isLiked;
    const currentLikes = post.likes || 0;
    
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: wasLiked ? currentLikes - 1 : currentLikes + 1,
              isLiked: !wasLiked,
            }
          : p
      )
    );

    try {
      const result = await PostsApi.likePost(postId);
      // Update with server response to ensure accuracy and persistence
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: result.likeCount || (wasLiked ? currentLikes - 1 : currentLikes + 1),
                isLiked: !wasLiked,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Failed to like post:", error);
      // Revert on error
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: currentLikes,
                isLiked: wasLiked,
              }
            : p
        )
      );
      showToast("Failed to like post. Please try again.", "error");
    }
  };

  const handleSave = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    const wasSaved = post.isSaved;
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isSaved: !wasSaved,
            }
          : p
      )
    );

    try {
      await PostsApi.savePost(postId);
      showToast(wasSaved ? "Post unsaved" : "Post saved!", "success");
    } catch (error) {
      // Revert optimistic update
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                isSaved: wasSaved,
              }
            : p
        )
      );
      showToast("Failed to save post", "error");
    }
  };

  const handleRepost = (post) => {
    setRepostPost(post);
    setShowRepostModal(true);
  };

  const submitRepost = async () => {
    if (repostPost) {
      try {
        // Create a new post with repost content
        const repostContent = repostComment
          ? `${repostComment}\n\nReposted from @${repostPost.username}`
          : `Reposted from @${repostPost.username}`;
        
        await PostsApi.createPost({
          content: `${repostContent}\n\n${repostPost.caption}`,
          tags: [],
          category: "general",
        });

        setShowRepostModal(false);
        setRepostPost(null);
        setRepostComment("");
        // Reload posts
        loadPosts(1, false);
      } catch (error) {
        console.error("Failed to repost:", error);
        showToast("Failed to repost. Please try again.", "error");
      }
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId];
    if (commentText && commentText.trim()) {
      try {
        const newCommentData = await PostsApi.addComment(postId, commentText);
        // Optimistically add comment to local state for immediate UI update
        setComments((prev) => ({
          ...prev,
          [postId]: [
            ...(prev[postId] || []),
            {
              id: newCommentData._id || newCommentData.id,
              _id: newCommentData._id || newCommentData.id,
              username: newCommentData.username || user?.username || "You",
              text: newCommentData.text,
              timestamp: newCommentData.timestamp || newCommentData.createdAt || new Date().toISOString(),
              avatar: (newCommentData.username || user?.username || "You")?.charAt(0) || "U",
              likes: newCommentData.likes || [],
            },
          ],
        }));
        // Update post comment count
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { 
                  ...p, 
                  comments: (p.comments || 0) + 1,
                  commentsList: [...(p.commentsList || []), newCommentData]
                }
              : p
          )
        );
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        showToast("Comment added!", "success");
      } catch (error) {
        console.error("Failed to add comment:", error);
        showToast("Failed to add comment. Please try again.", "error");
      }
    }
  };

  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div
      className="max-w-md mx-auto bg-black min-h-screen lg:bg-transparent w-full overflow-x-hidden"
      ref={feedRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50 py-4 text-center">
          <div className="text-amber-300">Refreshing...</div>
        </div>
      )}

        {/* Header with Back Button */}
        <div className="bg-black border-b border-stone-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-amber-300 hover:text-amber-200 text-xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-amber-300">Feed</h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-gold-gradient px-4 py-2 rounded-full font-semibold text-black hover:opacity-90 transition-opacity text-sm"
          >
            + Post
          </button>
        </div>

        {/* Stories Row */}
        {stories.length > 0 && (
          <div className="bg-black border-b border-stone-800 px-4 py-3 overflow-x-auto overflow-y-hidden">
            <div className="flex space-x-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex flex-col items-center flex-shrink-0"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold mb-1 ${
                      story.hasNew
                        ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500 p-0.5"
                        : "bg-stone-700 border-2 border-stone-600"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <span className="text-amber-300">{story.avatar}</span>
                    </div>
                  </div>
                  <span className="text-xs text-amber-200 truncate w-16 text-center">
                    {story.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed Posts */}
        {loading && posts.length === 0 && !backendError ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-amber-300">Loading posts...</div>
          </div>
        ) : backendError && posts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center px-4">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-amber-300 text-xl font-semibold mb-2">
              Backend Server Not Running
            </div>
            <div className="text-amber-400 mb-4">
              Please start the backend server to load posts.
            </div>
            <div className="text-amber-400 text-sm mt-2">
              Make sure MongoDB is running and the backend is started on port 5000.
            </div>
            <div className="text-amber-400 text-sm mt-2">
              To start: `cd backend && npm run dev` or use `start-dev.bat`/`start-dev.sh`
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-center px-4">
            <div className="text-6xl mb-4">✨</div>
            <div className="text-amber-300 text-xl font-semibold mb-2">
              No posts yet
            </div>
            <div className="text-amber-400">
              Be the first to share something with the community!
            </div>
          </div>
        ) : (
          <div className="pb-20">
            {posts.map((post, index) => (
          <div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostRef : null}
            className="bg-black border-b border-stone-800 mb-1"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <span className="text-amber-300 text-sm font-bold">
                      {post.avatar}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">
                    {post.username}
                  </div>
                  {post.isRepost && (
                    <div className="text-amber-400 text-xs">
                      Reposted from @{post.originalPost?.username}
                    </div>
                  )}
                </div>
              </div>
              <button className="text-white">⋯</button>
            </div>

            {/* Post Image with Double Tap */}
            {post.imageUrl && (
              <div
                className="relative w-full aspect-square bg-stone-900"
                onDoubleClick={() => handleDoubleTap(post.id)}
              >
                {post.mediaType === "video" ? (
                  <video
                    src={post.imageUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Heart Animation */}
                {heartAnimations[post.id] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-8xl animate-ping">❤️</div>
                  </div>
                )}
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <button onClick={() => handleLike(post.id)}>
                    {post.isLiked ? (
                      <span className="text-2xl">❤️</span>
                    ) : (
                      <span className="text-2xl">🤍</span>
                    )}
                  </button>
                  <button onClick={() => toggleComments(post.id)}>
                    <span className="text-2xl">💬</span>
                  </button>
                  <button onClick={() => handleRepost(post)}>
                    <span className="text-2xl">↗️</span>
                  </button>
                </div>
                <button onClick={() => handleSave(post.id)}>
                  {post.isSaved ? (
                    <span className="text-2xl">🔖</span>
                  ) : (
                    <span className="text-2xl">📌</span>
                  )}
                </button>
              </div>

              {/* Likes Count */}
              <div className="mb-1">
                <span className="text-white font-semibold text-sm">
                  {post.likes} likes
                </span>
              </div>

              {/* Caption */}
              <div className="mb-2">
                <span className="text-white font-semibold text-sm mr-2">
                  {post.username}
                </span>
                <span className="text-white text-sm">{post.caption}</span>
              </div>

              {/* View Comments */}
              {post.comments > 0 && !showComments[post.id] && (
                <button
                  onClick={() => toggleComments(post.id)}
                  className="text-stone-400 text-sm mb-2"
                >
                  View all {post.comments} comments
                </button>
              )}

              {/* Timestamp */}
              <div className="text-stone-400 text-xs uppercase mb-2">
                {post.timestamp}
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="border-t border-stone-800 pt-3 mt-3">
                  <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
                    {post.commentsList?.map((comment) => (
                      <div key={comment._id || comment.id} className="flex items-start">
                        <span className="text-white font-semibold text-sm mr-2">
                          {comment.username}
                        </span>
                        <span className="text-white text-sm">
                          {comment.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-white placeholder-stone-500 text-sm focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="text-amber-400 font-semibold text-sm disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            ))}
            {hasMore && (
              <div ref={lastPostRef} className="h-10 flex items-center justify-center">
                {loading && <div className="text-amber-300">Loading more...</div>}
              </div>
            )}
          </div>
        )}

      {/* Repost Modal */}
      {showRepostModal && repostPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Repost
            </h2>
            <div className="mb-4">
              <img
                src={repostPost.imageUrl}
                alt="Repost"
                className="w-full h-64 object-cover rounded-lg mb-3"
              />
              <textarea
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
                placeholder="Add a comment to your repost..."
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows="3"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRepostModal(false);
                  setRepostPost(null);
                  setRepostComment("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRepost}
                className="flex-1 px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90 transition-opacity"
              >
                Repost
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
              <h2 className="text-2xl font-bold text-amber-300 mb-4">
                Create Post
              </h2>
              <form onSubmit={handleCreatePost}>
                {newPostPreview && (
                  <div className="mb-4">
                    <img
                      src={newPostPreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                  rows="4"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <div className="flex space-x-3 mb-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                  >
                    Add Photo/Video
                  </button>
                  {newPostPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostPreview(null);
                        setNewPostMedia(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPostContent("");
                      setNewPostMedia(null);
                      setNewPostPreview(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newPostContent.trim() && !newPostMedia}
                    className="flex-1 px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramFeed;

