const Post = require("../models/Post");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/upload");

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

    const post = new Post({
      userId: req.user._id,
      username: req.user.username,
      content: content || "",
      mediaUrl,
      mediaType,
      tags: tags || [],
      category: category || "general",
    });

    const createdPost = await post.save();
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

    const count = await Post.countDocuments({});
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Add isLiked and isSaved status for authenticated users
    const postsWithStatus = posts.map((post) => {
      const postObj = post.toObject();
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

      const updatedPost = await post.save();
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

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  savePost,
};
