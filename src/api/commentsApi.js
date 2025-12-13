// Mock API service for comments functionality
import apiClient from "./apiClient";

class CommentsApi {
  // Get comments (mock implementation)
  async getComments(entityId) {
    // In a real implementation, this would fetch from the API
    // For now, return mock data for demo purposes
    if (entityId <= 4) {
      return [
        {
          id: 1,
          username: "TaylorBrown",
          text: "Great post! Thanks for sharing.",
          avatar: "T",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: 2,
          username: "JordanLee",
          text: "I found this really helpful!",
          avatar: "J",
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
      ];
    }
    return [];
  }

  // Add comment to a post
  async addPostComment(postId, commentData) {
    try {
      return await apiClient.post(
        `/posts/${postId}/comments`,
        commentData,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Add comment to a quest
  async addGlowQuestComment(questId, commentData) {
    try {
      return await apiClient.post(
        `/quests/${questId}/comments`,
        commentData,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete comment from a post
  async deletePostComment(postId, commentId) {
    try {
      return await apiClient.delete(
        `/posts/${postId}/comments/${commentId}`,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete comment from a quest
  async deleteGlowQuestComment(questId, commentId) {
    try {
      return await apiClient.delete(
        `/quests/${questId}/comments/${commentId}`,
        true
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new CommentsApi();
