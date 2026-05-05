const Post = require("../models/Post");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/upload");
const { createNotification } = require("./notificationController");

const extractMentionedUsernames = (text = "") => {
  const mentionRegex = /@([a-zA-Z0-9._]+)/g;
  const found = new Set();
  let match = mentionRegex.exec(text);
  while (match) {
    const username = String(match[1] || "").toLowerCase();
    if (username) found.add(username);
    match = mentionRegex.exec(text);
  }
  return Array.from(found);
};

const notifyMentions = async (mentionedUsers, actorUser, postId) => {
  await Promise.all(
    mentionedUsers
      .filter((u) => u._id.toString() !== actorUser._id.toString())
      .map((u) =>
        createNotification(
          u._id,
          "You were mentioned",
          `${actorUser.name || actorUser.username} mentioned you in a post.`,
          "info",
          postId,
          "post"
        )
      )
  );
};

// Create a new post
const createPost = async (req, res) => {
  try {
    let { content, tags, category } = req.body;
    let mediaUrl = "";
    let mediaType = "image";

    // Handle tags - can be array or string
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        // If not JSON, treat as comma-separated string
        tags = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      }
    } else if (!Array.isArray(tags)) {
      tags = [];
    }

    // Handle file upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file);
        mediaUrl = result.secure_url;
        mediaType = result.resource_type === "video" ? "video" : "image";
      } catch (uploadError) {
        // Fallback to local file URL if Cloudinary fails
        mediaUrl = `/uploads/${req.file.filename}`;
        mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
      }
    }

    const normalizedContent = content || "";
    const mentionUsernames = extractMentionedUsernames(normalizedContent);

    const post = new Post({
      userId: req.user._id,
      username: req.user.username,
      authorName: req.user.name || req.user.username,
      authorAvatar: req.user.avatar || "",
      content: normalizedContent,
      mediaUrl,
      mediaType,
      tags: tags || [],
      mentions: mentionUsernames,
      category: category || "general",
    });

    const createdPost = await post.save();
    if (mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: mentionUsernames },
      }).select("_id username");
      await notifyMentions(mentionedUsers, req.user, createdPost._id);
    }
    res.status(201).json(createdPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all posts with pagination
const getPosts = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    const userId = req.user?._id; // Get current user ID if authenticated
    const visibilityFilter = userId
      ? { "reports.userId": { $ne: userId } }
      : {};

    const count = await Post.countDocuments(visibilityFilter);
    const posts = await Post.find(visibilityFilter)
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Add isLiked and isSaved status for authenticated users
    const postsWithStatus = posts.map((post) => {
      const postObj = post.toObject();
      const profileName =
        postObj.userId?.name || postObj.authorName || postObj.username;
      const profileAvatar = postObj.userId?.avatar || postObj.authorAvatar || "";
      const profileUsername =
        postObj.userId?.username || postObj.username || profileName;

      postObj.username = profileUsername;
      postObj.authorName = profileName;
      postObj.authorAvatar = profileAvatar;
      if (userId) {
        postObj.isLiked = post.likes.some(
          (like) => like.userId.toString() === userId.toString()
        );
        postObj.isSaved = post.savedBy.some(
          (save) => save.userId.toString() === userId.toString()
        );
      } else {
        postObj.isLiked = false;
        postObj.isSaved = false;
      }
      return postObj;
    });

    res.json({
      posts: postsWithStatus,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get saved posts for the authenticated user
const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const posts = await Post.find({ "savedBy.userId": userId })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 });

    const postsWithStatus = posts.map((post) => {
      const postObj = post.toObject();
      const profileName =
        postObj.userId?.name || postObj.authorName || postObj.username;
      const profileAvatar = postObj.userId?.avatar || postObj.authorAvatar || "";
      const profileUsername =
        postObj.userId?.username || postObj.username || profileName;

      postObj.username = profileUsername;
      postObj.authorName = profileName;
      postObj.authorAvatar = profileAvatar;
      postObj.isLiked = post.likes.some(
        (like) => like.userId.toString() === userId.toString()
      );
      postObj.isSaved = true;
      return postObj;
    });

    return res.json({ posts: postsWithStatus });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get post by ID
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { content, tags } = req.body;

    const post = await Post.findById(req.params.id);

    if (post) {
      // Check if user is owner of the post
      if (post.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to update this post" });
      }

      post.content = content || post.content;
      post.tags = tags || post.tags;
      post.authorName = req.user.name || post.authorName || req.user.username;
      post.authorAvatar = req.user.avatar || post.authorAvatar || "";
      post.mentions = extractMentionedUsernames(post.content);

      if (req.file) {
        try {
          const result = await uploadToCloudinary(req.file);
          post.mediaUrl = result.secure_url;
          post.mediaType = result.resource_type === "video" ? "video" : "image";
        } catch (uploadError) {
          post.mediaUrl = `/uploads/${req.file.filename}`;
          post.mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
        }
      }

      if (req.body.removeMedia === "true") {
        post.mediaUrl = "";
        post.mediaType = "image";
      }

      const updatedPost = await post.save();
      if (post.mentions.length > 0) {
        const mentionedUsers = await User.find({
          username: { $in: post.mentions },
        }).select("_id username");
        await notifyMentions(mentionedUsers, req.user, updatedPost._id);
      }
      res.json(updatedPost);
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post) {
      // Check if user is owner of the post
      if (post.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this post" });
      }

      await Post.deleteOne({ _id: post._id });
      res.json({ message: "Post removed" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like post
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post) {
      // Check if user already liked the post
      const alreadyLiked = post.likes.find(
        (like) => like.userId.toString() === req.user._id.toString()
      );

      if (alreadyLiked) {
        // Unlike the post
        post.likes = post.likes.filter(
          (like) => like.userId.toString() !== req.user._id.toString()
        );
      } else {
        // Like the post
        post.likes.push({
          userId: req.user._id,
        });
      }

      const updatedPost = await post.save();
      res.json({
        likes: updatedPost.likes,
        likeCount: updatedPost.likes.length,
      });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id);

    if (post) {
      const comment = {
        userId: req.user._id,
        username: req.user.username,
        text,
      };

      post.comments.push(comment);
      const updatedPost = await post.save();

      // Return the newly created comment with all fields
      const newComment = updatedPost.comments[updatedPost.comments.length - 1];
      res.status(201).json({
        _id: newComment._id,
        id: newComment._id,
        userId: newComment.userId,
        username: newComment.username,
        text: newComment.text,
        timestamp: newComment.timestamp,
        createdAt: newComment.timestamp,
        likes: newComment.likes || [],
      });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment from post
const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (post) {
      const comment = post.comments.find(
        (comment) => comment._id.toString() === req.params.commentId
      );

      if (comment) {
        // Check if user is owner of the comment or post
        if (
          comment.userId.toString() !== req.user._id.toString() &&
          post.userId.toString() !== req.user._id.toString()
        ) {
          return res
            .status(401)
            .json({ message: "Not authorized to delete this comment" });
        }

        post.comments = post.comments.filter(
          (comment) => comment._id.toString() !== req.params.commentId
        );

        const updatedPost = await post.save();
        res.json({ message: "Comment removed" });
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save/bookmark post
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post) {
      // Check if user already saved the post
      const alreadySaved = post.savedBy.find(
        (save) => save.userId.toString() === req.user._id.toString()
      );

      if (alreadySaved) {
        // Unsave the post
        post.savedBy = post.savedBy.filter(
          (save) => save.userId.toString() !== req.user._id.toString()
        );
      } else {
        // Save the post
        post.savedBy.push({
          userId: req.user._id,
        });
      }

      const updatedPost = await post.save();
      res.json({
        savedBy: updatedPost.savedBy,
        savedCount: updatedPost.savedBy.length,
        isSaved: !alreadySaved,
      });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Report post
const reportPost = async (req, res) => {
  try {
    const { reason, reportCategory, additionalDetails } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.userId.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot report your own post" });
    }

    const alreadyReported = post.reports.find(
      (report) => report.userId.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ message: "Post already reported by this user" });
    }

    post.reports.push({
      userId: req.user._id,
      reportCategory: reportCategory || "other",
      reason: reason?.trim() || "Inappropriate content",
      additionalDetails: additionalDetails?.trim() || "",
      moderationStatus: "pending",
    });

    await post.save();
    return res.json({
      message:
        "Report submitted. This post will be hidden from your feed while moderation reviews it.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: get reported posts queue
const getReportedPosts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const pageSize = 20;
    const page = Number(req.query.page) || 1;
    const statusFilter = req.query.status;
    const categoryFilter = req.query.category;
    const elemMatch = {};
    if (statusFilter) {
      elemMatch.moderationStatus = statusFilter;
    }
    if (categoryFilter) {
      elemMatch.reportCategory = categoryFilter;
    }
    const reportMatch = Object.keys(elemMatch).length
      ? { reports: { $elemMatch: elemMatch } }
      : { "reports.0": { $exists: true } };

    const count = await Post.countDocuments(reportMatch);
    const posts = await Post.find(reportMatch)
      .populate("userId", "name username email")
      .sort({ "reports.reportedAt": -1, createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    return res.json({
      posts,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Admin: update report status
const updateReportStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { postId, reportId } = req.params;
    const { moderationStatus } = req.body;
    const allowed = ["pending", "under_review", "resolved", "dismissed"];
    if (!allowed.includes(moderationStatus)) {
      return res.status(400).json({ message: "Invalid moderation status" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const report = post.reports.id(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.moderationStatus = moderationStatus;
    await post.save();
    return res.json({ message: "Report status updated", post });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getSavedPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  savePost,
  reportPost,
  getReportedPosts,
  updateReportStatus,
};
