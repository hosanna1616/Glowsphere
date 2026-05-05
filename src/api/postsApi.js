import apiClient from "./apiClient";

class PostsApi {
  // Get all posts with pagination
  async getPosts(page = 1) {
    try {
      const response = await apiClient.get(`/posts?page=${page}`, true);
      return response;
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      throw error;
    }
  }

  async getSavedPosts() {
    try {
      const response = await apiClient.get("/posts/saved", true);
      return response;
    } catch (error) {
      console.error("Failed to fetch saved posts:", error);
      throw error;
    }
  }

  // Get post by ID
  async getPostById(postId) {
    try {
      return await apiClient.get(`/posts/${postId}`, true);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      throw error;
    }
  }

  // Create a new post
  async createPost(postData, mediaFile = null) {
    try {
      const token = apiClient.getToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      if (mediaFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("content", postData.content || "");
        if (postData.tags && postData.tags.length > 0) {
          // Backend expects tags as array, not JSON string
          postData.tags.forEach((tag) => {
            formData.append("tags", tag);
          });
        }
        formData.append("category", postData.category || "general");
        formData.append("media", mediaFile);

        const response = await fetch(`${apiClient.getApiBaseUrl()}/posts`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 401) {
            apiClient.removeToken();
            throw new Error("Authentication required. Please log in again.");
          }
          const errorText = await response.text();
          let errorMessage = `Failed to create post (${response.status})`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        return await response.json();
      } else {
        // Text-only post
        return await apiClient.post("/posts", postData, true);
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      // Re-throw with better error message for network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("connect to server")
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection and ensure the backend is running.",
        );
      }
      throw error;
    }
  }

  // Like/unlike a post
  async likePost(postId) {
    try {
      return await apiClient.put(`/posts/${postId}/like`, {}, true);
    } catch (error) {
      console.error("Failed to like post:", error);
      throw error;
    }
  }

  // Add comment to post
  async addComment(postId, text) {
    try {
      return await apiClient.post(`/posts/${postId}/comments`, { text }, true);
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  }

  // Add reply to comment
  async addReply(postId, commentId, text) {
    try {
      return await apiClient.post(
        `/posts/${postId}/comments/${commentId}/replies`,
        { text },
        true,
      );
    } catch (error) {
      console.error("Failed to add reply:", error);
      throw error;
    }
  }

  // Delete comment
  async deleteComment(postId, commentId) {
    try {
      return await apiClient.delete(
        `/posts/${postId}/comments/${commentId}`,
        true,
      );
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    }
  }

  // Save/bookmark post
  async savePost(postId) {
    try {
      return await apiClient.post(`/posts/${postId}/save`, {}, true);
    } catch (error) {
      console.error("Failed to save post:", error);
      throw error;
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      return await apiClient.delete(`/posts/${postId}`, true);
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw error;
    }
  }

  // Update post
  async updatePost(postId, postData, mediaFile = null) {
    try {
      const token = apiClient.getToken();
      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      if (mediaFile || postData?.removeMedia) {
        const formData = new FormData();
        if (postData?.content != null)
          formData.append("content", postData.content);
        if (postData?.removeMedia) formData.append("removeMedia", "true");
        if (Array.isArray(postData?.tags)) {
          postData.tags.forEach((tag) => formData.append("tags", tag));
        }
        if (mediaFile) formData.append("media", mediaFile);

        const response = await fetch(
          `${apiClient.getApiBaseUrl()}/posts/${postId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to update post (${response.status})`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        return await response.json();
      }

      return await apiClient.put(`/posts/${postId}`, postData, true);
    } catch (error) {
      console.error("Failed to update post:", error);
      throw error;
    }
  }

  // Report post with moderation metadata
  async reportPost(
    postId,
    {
      reason = "Inappropriate content",
      reportCategory = "other",
      additionalDetails = "",
    } = {},
  ) {
    try {
      return await apiClient.post(
        `/posts/${postId}/report`,
        { reason, reportCategory, additionalDetails },
        true,
      );
    } catch (error) {
      console.error("Failed to report post:", error);
      throw error;
    }
  }

  async getReportQueue({ page = 1, status = "", category = "" } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    return apiClient.get(`/posts/reports/queue?${params.toString()}`, true);
  }

  async updateReportStatus(postId, reportId, moderationStatus) {
    return apiClient.put(
      `/posts/reports/${postId}/${reportId}/status`,
      { moderationStatus },
      true,
    );
  }
}

export default new PostsApi();
