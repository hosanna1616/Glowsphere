import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, Ellipsis } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import PostsApi from "../../api/postsApi";
import { resolveMediaUrl } from "../../utils/media";

const REPORT_OPTIONS = [
  { id: "harmful_or_dangerous", label: "Harmful or dangerous acts" },
  { id: "hate_or_harassment", label: "Hate speech or harassment" },
  { id: "violence_or_threat", label: "Violence or threats" },
  { id: "nudity_or_sexual", label: "Nudity or sexual content" },
  { id: "misinformation", label: "Misinformation" },
  { id: "spam_or_scam", label: "Spam, fraud, or scam" },
  { id: "other", label: "Other" },
];

const mentionRegex = /@([a-zA-Z0-9._]+)/g;

const InstagramFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [newReply, setNewReply] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [showReplies, setShowReplies] = useState({});
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
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostMedia, setEditPostMedia] = useState(null);
  const [editPostPreview, setEditPostPreview] = useState(null);
  const [removeEditMedia, setRemoveEditMedia] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState(null);
  const [activeSharePostId, setActiveSharePostId] = useState(null);
  const [highlightedSharedPostId, setHighlightedSharedPostId] = useState(null);
  const [reportForm, setReportForm] = useState({
    reportCategory: "harmful_or_dangerous",
    reason: "",
    additionalDetails: "",
  });
  const [hiddenReportedPosts, setHiddenReportedPosts] = useState({});
  const feedRef = useRef(null);
  const observerRef = useRef(null);
  const lastPostRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const sharedPostFetchAttemptedRef = useRef({});
  const sharedPostId =
    new URLSearchParams(location.search).get("sharedPost")?.trim() || "";

  // Get user's avatar initial
  const getUserAvatar = (username) => {
    if (!username) return "U";
    return username.charAt(0).toUpperCase();
  };

  const openMentionProfile = (username) => {
    navigate(`/profile?username=${encodeURIComponent(username)}`);
  };

  const renderCaptionWithMentions = (text = "") => {
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const mention = match[1];
      parts.push(
        <button
          key={`${mention}-${match.index}`}
          type="button"
          onClick={() => openMentionProfile(mention)}
          className="text-amber-300 hover:text-amber-200 font-medium"
        >
          @{mention}
        </button>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    mentionRegex.lastIndex = 0;
    return parts.length > 0 ? parts : text;
  };

  // Format timestamp
  const formatTimestamp = (date) => {
    if (!date) return "";
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postDate.toLocaleDateString();
  };

  const mapPostToViewModel = (post) => ({
    id: post._id,
    username: post.username,
    displayName: post.authorName || post.username,
    avatar: resolveMediaUrl(post.authorAvatar) || null,
    avatarInitial: getUserAvatar(post.authorName || post.username),
    imageUrl: resolveMediaUrl(post.mediaUrl) || null,
    caption: post.content,
    timestamp: formatTimestamp(post.createdAt),
    likes: post.likes?.length || 0,
    comments: post.comments?.length || 0,
    isLiked:
      post.likes?.some(
        (like) => like.userId?.toString() === user?._id?.toString(),
      ) || false,
    isSaved:
      post.savedBy?.some(
        (save) => save.userId?.toString() === user?._id?.toString(),
      ) || false,
    mediaType: post.mediaType || "image",
    commentsList: post.comments || [],
    createdAt: post.createdAt,
    userId: post.userId,
    ownerId: post.userId?._id || post.userId,
  });

  // Load posts from API
  const loadPosts = async (page = 1, append = false) => {
    try {
      setLoading(true);
      setBackendError(false); // Reset backend error state when attempting to load
      const response = await PostsApi.getPosts(page);

      if (!response || !response.posts) {
        throw new Error("Invalid response from server");
      }

      const formattedPosts = response.posts.map(mapPostToViewModel);

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
              userAvatar: resolveMediaUrl(comment.userAvatar) || "",
              text: comment.text,
              timestamp: comment.timestamp || comment.createdAt,
              avatar: comment.username?.charAt(0) || "U",
              likes: comment.likes || [],
              replies: (comment.replies || []).map((reply) => ({
                ...reply,
                userAvatar: resolveMediaUrl(reply.userAvatar) || "",
              })),
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
      const isConnectionError =
        errorMessage.includes("connect to server") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError");

      if (isConnectionError) {
        setBackendError(true);
      } else {
        setBackendError(false);
        // Only show toast for non-connection errors to avoid spam
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("Unauthorized")
        ) {
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

  useEffect(() => {
    if (!sharedPostId) return;

    const sharedPostExists = posts.some(
      (post) => String(post.id) === String(sharedPostId),
    );

    const focusSharedPost = () => {
      const target = document.getElementById(`post-${sharedPostId}`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedSharedPostId(sharedPostId);
      setTimeout(() => setHighlightedSharedPostId(null), 2200);
    };

    if (sharedPostExists) {
      setShowComments((prev) => ({ ...prev, [sharedPostId]: true }));
      setTimeout(focusSharedPost, 150);
      return;
    }

    if (sharedPostFetchAttemptedRef.current[sharedPostId]) {
      return;
    }

    sharedPostFetchAttemptedRef.current[sharedPostId] = true;
    (async () => {
      try {
        const post = await PostsApi.getPostById(sharedPostId);
        if (!post?._id) return;
        const formattedPost = mapPostToViewModel(post);
        setPosts((prev) => {
          if (prev.some((item) => String(item.id) === String(formattedPost.id))) {
            return prev;
          }
          return [formattedPost, ...prev];
        });
      } catch (error) {
        showToast("Shared post is unavailable or was removed.", "error");
      }
    })();
  }, [sharedPostId, posts]);

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

  const handleEditMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditPostMedia(file);
    setRemoveEditMedia(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPostPreview(reader.result);
    };
    reader.readAsDataURL(file);
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
      const errorMessage =
        error.message || "Failed to create post. Please try again.";

      // Handle authentication errors
      if (
        errorMessage.includes("Authentication required") ||
        errorMessage.includes("401")
      ) {
        showToast("Please log in again", "error");
        navigate("/login");
      } else {
        showToast(errorMessage, "error");
      }
    }
  };

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(currentPage + 1, true);
        }
      },
      { threshold: 0.1 },
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

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: wasLiked ? currentLikes - 1 : currentLikes + 1,
              isLiked: !wasLiked,
            }
          : p,
      ),
    );

    try {
      const result = await PostsApi.likePost(postId);
      // Update with server response to ensure accuracy and persistence
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes:
                  result.likeCount ||
                  (wasLiked ? currentLikes - 1 : currentLikes + 1),
                isLiked: !wasLiked,
              }
            : p,
        ),
      );
    } catch (error) {
      console.error("Failed to like post:", error);
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes: currentLikes,
                isLiked: wasLiked,
              }
            : p,
        ),
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
          : p,
      ),
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
            : p,
        ),
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
              userAvatar:
                resolveMediaUrl(newCommentData.userAvatar) ||
                resolveMediaUrl(user?.avatar) ||
                "",
              text: newCommentData.text,
              timestamp:
                newCommentData.timestamp ||
                newCommentData.createdAt ||
                new Date().toISOString(),
              avatar:
                (newCommentData.username || user?.username || "You")?.charAt(
                  0,
                ) || "U",
              likes: newCommentData.likes || [],
              replies: (newCommentData.replies || []).map((reply) => ({
                ...reply,
                userAvatar: resolveMediaUrl(reply.userAvatar) || "",
              })),
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
                  commentsList: [
                    ...(p.commentsList || []),
                    {
                      ...newCommentData,
                      userAvatar:
                        resolveMediaUrl(newCommentData.userAvatar) ||
                        resolveMediaUrl(user?.avatar) ||
                        "",
                      replies: (newCommentData.replies || []).map((reply) => ({
                        ...reply,
                        userAvatar: resolveMediaUrl(reply.userAvatar) || "",
                      })),
                    },
                  ],
                }
              : p,
          ),
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

  const toggleReplyInput = (postId, commentId) => {
    const key = `${postId}:${commentId}`;
    setShowReplyInput((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleReplies = (postId, commentId) => {
    const key = `${postId}:${commentId}`;
    setShowReplies((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddReply = async (postId, commentId) => {
    const key = `${postId}:${commentId}`;
    const replyText = newReply[key];
    if (!replyText?.trim()) return;

    try {
      const createdReply = await PostsApi.addReply(
        postId,
        commentId,
        replyText.trim(),
      );
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            commentsList: (post.commentsList || []).map((comment) => {
              const currentCommentId = comment._id || comment.id;
              if (String(currentCommentId) !== String(commentId)) {
                return comment;
              }
              return {
                ...comment,
                replies: [
                  ...(comment.replies || []),
                  {
                    ...createdReply,
                    userAvatar:
                      resolveMediaUrl(createdReply.userAvatar) ||
                      resolveMediaUrl(user?.avatar) ||
                      "",
                  },
                ],
              };
            }),
          };
        }),
      );
      setNewReply((prev) => ({ ...prev, [key]: "" }));
      setShowReplies((prev) => ({ ...prev, [key]: true }));
      showToast("Reply added!", "success");
    } catch (error) {
      console.error("Failed to add reply:", error);
      showToast("Failed to add reply. Please try again.", "error");
    }
  };

  const togglePostMenu = (postId) => {
    setActivePostMenu((prev) => (prev === postId ? null : postId));
  };

  const toggleShareMenu = (postId) => {
    setActiveSharePostId((prev) => (prev === postId ? null : postId));
  };

  const closeShareMenu = () => {
    setActiveSharePostId(null);
  };

  const getSharePayload = (post) => {
    const configuredBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL;
    const appBaseUrl = (configuredBaseUrl || window.location.origin).replace(
      /\/+$/,
      "",
    );
    // Use a stable, shareable URL that works in production deployments.
    const postLink = `${appBaseUrl}/feed?sharedPost=${encodeURIComponent(post.id)}`;
    const shareText = `${post.displayName}: ${post.caption || "Check this post on GlowSphere"}`;
    return { postLink, shareText };
  };

  const shareToTelegram = (post) => {
    const { postLink, shareText } = getSharePayload(post);
    const url = `https://t.me/share/url?url=${encodeURIComponent(postLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeShareMenu();
  };

  const shareToWhatsApp = (post) => {
    const { postLink, shareText } = getSharePayload(post);
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${postLink}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeShareMenu();
  };

  const copyPostLink = async (post) => {
    try {
      const { postLink } = getSharePayload(post);
      await navigator.clipboard.writeText(postLink);
      showToast("Post link copied!", "success");
    } catch (error) {
      showToast("Failed to copy link", "error");
    } finally {
      closeShareMenu();
    }
  };

  const closePostMenu = () => {
    setActivePostMenu(null);
  };

  const requestDeletePost = (postId) => {
    closePostMenu();
    setDeletingPostId(postId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      await PostsApi.deletePost(deletingPostId);
      setPosts((prev) => prev.filter((post) => post.id !== deletingPostId));
      showToast("Post deleted successfully", "success");
      setShowDeleteConfirmModal(false);
      setDeletingPostId(null);
    } catch (error) {
      const errorMessage = error.message || "Failed to delete post";
      showToast(errorMessage, "error");
    }
  };

  const openEditPost = (post) => {
    closePostMenu();
    setEditingPost(post);
    setEditPostContent(post.caption || "");
    setEditPostPreview(post.imageUrl || null);
    setEditPostMedia(null);
    setRemoveEditMedia(false);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
    setShowEditPostModal(true);
  };

  const handleEditPost = async () => {
    if (!editingPost) return;
    const updatedContent = editPostContent.trim();
    if (!updatedContent) {
      showToast("Post content cannot be empty", "warning");
      return;
    }

    try {
      const updatedPost = await PostsApi.updatePost(
        editingPost.id,
        {
          content: updatedContent,
          removeMedia: removeEditMedia,
        },
        editPostMedia,
      );
      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                caption: updatedPost.content,
                displayName: updatedPost.authorName || post.displayName,
                avatar:
                  resolveMediaUrl(updatedPost.authorAvatar) || post.avatar,
                avatarInitial: getUserAvatar(
                  updatedPost.authorName || post.displayName,
                ),
                imageUrl: resolveMediaUrl(updatedPost.mediaUrl) || null,
                mediaType: updatedPost.mediaType || "image",
              }
            : post,
        ),
      );
      setShowEditPostModal(false);
      setEditingPost(null);
      setEditPostContent("");
      setEditPostMedia(null);
      setEditPostPreview(null);
      setRemoveEditMedia(false);
      showToast("Post updated successfully", "success");
    } catch (error) {
      showToast(error.message || "Failed to update post", "error");
    }
  };

  const openReportPost = (postId) => {
    closePostMenu();
    setReportingPostId(postId);
    setReportForm({
      reportCategory: "harmful_or_dangerous",
      reason: "",
      additionalDetails: "",
    });
    setShowReportModal(true);
  };

  const handleReportPost = async () => {
    if (!reportingPostId) return;
    try {
      const selectedLabel =
        REPORT_OPTIONS.find((opt) => opt.id === reportForm.reportCategory)
          ?.label || "Other";
      const reason =
        reportForm.reason.trim() || `Reported for: ${selectedLabel}`;

      await PostsApi.reportPost(reportingPostId, {
        reportCategory: reportForm.reportCategory,
        reason,
        additionalDetails: reportForm.additionalDetails.trim(),
      });
      setHiddenReportedPosts((prev) => ({ ...prev, [reportingPostId]: true }));
      setPosts((prev) => prev.filter((post) => post.id !== reportingPostId));
      setShowReportModal(false);
      setReportingPostId(null);
      showToast(
        "Report submitted. This post is now hidden from your feed while we review it.",
        "success",
      );
    } catch (error) {
      const errorMessage = error.message || "Failed to report post";
      showToast(errorMessage, "error");
    }
  };

  const visiblePosts = posts.filter((post) => !hiddenReportedPosts[post.id]);

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
            Make sure MongoDB is running and the backend is started on port
            5000.
          </div>
          <div className="text-amber-400 text-sm mt-2">
            To start: `cd backend && npm run dev` or use
            `start-dev.bat`/`start-dev.sh`
          </div>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-center px-4">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-amber-300 text-xl font-semibold mb-2">No posts yet</div>
          <div className="text-amber-400">
            Be the first to share something with the community!
          </div>
        </div>
      ) : (
        <div className="pb-20">
          {visiblePosts.map((post, index) => (
              <div
                key={post.id}
                id={`post-${post.id}`}
                ref={index === visiblePosts.length - 1 ? lastPostRef : null}
                className={`bg-black border-b mb-1 transition-all duration-500 ${
                  highlightedSharedPostId === post.id
                    ? "border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.7)]"
                    : "border-stone-800"
                }`}
              >
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {post.avatar ? (
                          <img
                            src={post.avatar}
                            alt={post.displayName}
                            className="w-full h-full object-cover"
                            onError={() =>
                              setPosts((prev) =>
                                prev.map((item) =>
                                  item.id === post.id
                                    ? { ...item, avatar: null }
                                    : item,
                                ),
                              )
                            }
                          />
                        ) : (
                          <span className="text-amber-300 text-sm font-bold">
                            {post.avatarInitial}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {post.displayName}
                      </div>
                      {post.isRepost && (
                        <div className="text-amber-400 text-xs">
                          Reposted from @{post.originalPost?.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => togglePostMenu(post.id)}
                      className="text-white px-2 py-1"
                      aria-label="Post actions"
                    >
                      <Ellipsis className="w-5 h-5" />
                    </button>
                    {activePostMenu === post.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-stone-900 border border-amber-500/30 rounded-lg shadow-lg z-20">
                        {post.ownerId?.toString() === user?._id?.toString() && (
                          <button
                            onClick={() => openEditPost(post)}
                            className="w-full text-left px-4 py-2 text-amber-200 hover:bg-stone-800"
                          >
                            Edit post
                          </button>
                        )}
                        {post.ownerId?.toString() === user?._id?.toString() && (
                          <button
                            onClick={() => requestDeletePost(post.id)}
                            className="w-full text-left px-4 py-2 text-red-300 hover:bg-stone-800"
                          >
                            Delete post
                          </button>
                        )}
                        {post.ownerId?.toString() !== user?._id?.toString() && (
                          <button
                            onClick={() => openReportPost(post.id)}
                            className="w-full text-left px-4 py-2 text-amber-200 hover:bg-stone-800 rounded-lg"
                          >
                            Report post
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                      <button
                        onClick={() => handleLike(post.id)}
                        aria-label="Like post"
                      >
                        <Heart
                          className={`w-6 h-6 transition-colors ${
                            post.isLiked
                              ? "fill-red-500 text-red-500"
                              : "text-white"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        aria-label="Comment on post"
                      >
                        <MessageCircle className="w-6 h-6 text-white" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleShareMenu(post.id)}
                          aria-label="Share post"
                        >
                          <Send className="w-6 h-6 text-white" />
                        </button>
                        {activeSharePostId === post.id && (
                          <div className="absolute left-0 mt-2 w-44 bg-stone-900 border border-amber-500/30 rounded-lg shadow-lg z-20">
                            <button
                              type="button"
                              onClick={() => shareToTelegram(post)}
                              className="w-full text-left px-4 py-2 text-amber-200 hover:bg-stone-800"
                            >
                              Share to Telegram
                            </button>
                            <button
                              type="button"
                              onClick={() => shareToWhatsApp(post)}
                              className="w-full text-left px-4 py-2 text-amber-200 hover:bg-stone-800"
                            >
                              Share to WhatsApp
                            </button>
                            <button
                              type="button"
                              onClick={() => copyPostLink(post)}
                              className="w-full text-left px-4 py-2 text-amber-200 hover:bg-stone-800 rounded-b-lg"
                            >
                              Copy Post Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSave(post.id)}
                      aria-label="Save post"
                    >
                      <Bookmark
                        className={`w-6 h-6 transition-colors ${
                          post.isSaved
                            ? "fill-amber-400 text-amber-400"
                            : "text-white"
                        }`}
                      />
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
                    <span className="text-white text-sm break-words">
                      {renderCaptionWithMentions(post.caption)}
                    </span>
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
                          <div
                            key={comment._id || comment.id}
                            className="space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-stone-700 overflow-hidden flex-shrink-0 mt-0.5">
                                {comment.userAvatar ? (
                                  <img
                                    src={comment.userAvatar}
                                    alt={comment.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[11px] text-amber-200 font-semibold">
                                    {(comment.username || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-white font-semibold text-sm mr-2">
                                  {comment.username}
                                </span>
                                <span className="text-white text-sm break-words">
                                  {renderCaptionWithMentions(comment.text)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pl-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleReplyInput(
                                    post.id,
                                    comment._id || comment.id,
                                  )
                                }
                                className="text-xs text-amber-300 hover:text-amber-200"
                              >
                                Reply
                              </button>
                              {(comment.replies || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleReplies(
                                      post.id,
                                      comment._id || comment.id,
                                    )
                                  }
                                  className="text-xs text-stone-400 hover:text-stone-300"
                                >
                                  {showReplies[
                                    `${post.id}:${comment._id || comment.id}`
                                  ]
                                    ? "Hide replies"
                                    : `View replies (${(comment.replies || []).length})`}
                                </button>
                              )}
                            </div>
                            {showReplies[
                              `${post.id}:${comment._id || comment.id}`
                            ] &&
                              (comment.replies || []).length > 0 && (
                                <div className="pl-4 border-l border-stone-700 space-y-1">
                                  {(comment.replies || []).map((reply) => (
                                    <div
                                      key={reply._id || reply.id}
                                      className="flex items-start gap-2"
                                    >
                                      <div className="w-6 h-6 rounded-full bg-stone-700 overflow-hidden flex-shrink-0 mt-0.5">
                                        {reply.userAvatar ? (
                                          <img
                                            src={reply.userAvatar}
                                            alt={reply.username}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-[10px] text-amber-200 font-semibold">
                                            {(reply.username || "U")
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="text-amber-200 font-semibold text-xs mr-2">
                                          {reply.username}
                                        </span>
                                        <span className="text-amber-100 text-xs break-words">
                                          {renderCaptionWithMentions(
                                            reply.text,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            {showReplyInput[
                              `${post.id}:${comment._id || comment.id}`
                            ] && (
                              <div className="pl-4 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={
                                    newReply[
                                      `${post.id}:${comment._id || comment.id}`
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setNewReply((prev) => ({
                                      ...prev,
                                      [`${post.id}:${comment._id || comment.id}`]:
                                        e.target.value,
                                    }))
                                  }
                                  placeholder="Write a reply..."
                                  className="flex-1 bg-transparent text-amber-100 placeholder-stone-500 text-xs focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddReply(
                                        post.id,
                                        comment._id || comment.id,
                                      );
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddReply(
                                      post.id,
                                      comment._id || comment.id,
                                    )
                                  }
                                  disabled={
                                    !newReply[
                                      `${post.id}:${comment._id || comment.id}`
                                    ]?.trim()
                                  }
                                  className="text-amber-400 font-semibold text-xs disabled:opacity-50"
                                >
                                  Send
                                </button>
                              </div>
                            )}
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
            <div
              ref={lastPostRef}
              className="h-10 flex items-center justify-center"
            >
              {loading && <div className="text-amber-300">Loading more...</div>}
            </div>
          )}
        </div>
      )}

      {/* Repost Modal */}
      {showRepostModal && repostPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Repost</h2>
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

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30">
            <h2 className="text-2xl font-bold text-red-300 mb-3">
              Delete Post
            </h2>
            <p className="text-amber-100/90 mb-5 leading-relaxed">
              Delete this post permanently? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeletingPostId(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Report Post
            </h2>
            <p className="text-amber-100/80 text-sm mb-4">
              Help keep the community safe. Select the closest reason and add
              extra details if needed.
            </p>
            <div className="space-y-2 mb-4">
              {REPORT_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-500/20 px-3 py-2 text-amber-100 cursor-pointer hover:bg-stone-800"
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={option.id}
                    checked={reportForm.reportCategory === option.id}
                    onChange={(e) =>
                      setReportForm((prev) => ({
                        ...prev,
                        reportCategory: e.target.value,
                      }))
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportForm.reason}
              onChange={(e) =>
                setReportForm((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Short reason (optional)"
              className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 mb-3"
              rows="2"
            />
            <textarea
              value={reportForm.additionalDetails}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  additionalDetails: e.target.value,
                }))
              }
              placeholder="Additional details (optional)"
              className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 mb-4"
              rows="3"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportingPostId(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReportPost}
                className="flex-1 px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPostModal && editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Edit Post
            </h2>
            {editPostPreview && (
              <div className="mb-4">
                {editingPost.mediaType === "video" && !editPostMedia ? (
                  <video
                    src={editPostPreview}
                    className="w-full h-64 object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <img
                    src={editPostPreview}
                    alt="Edit preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </div>
            )}
            <textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              rows="5"
            />
            <input
              type="file"
              ref={editFileInputRef}
              onChange={handleEditMediaSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
              >
                Replace Photo/Video
              </button>
              {editPostPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setEditPostMedia(null);
                    setEditPostPreview(null);
                    setRemoveEditMedia(true);
                    if (editFileInputRef.current) {
                      editFileInputRef.current.value = "";
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-900/20"
                >
                  Remove Media
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowEditPostModal(false);
                  setEditingPost(null);
                  setEditPostContent("");
                  setEditPostMedia(null);
                  setEditPostPreview(null);
                  setRemoveEditMedia(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPost}
                className="flex-1 px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
              >
                Save
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
                placeholder="What's on your mind? Use @username to mention someone."
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
