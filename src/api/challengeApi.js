import apiClient from "./apiClient";

class ChallengeApi {
  // Get all challenges
  async getChallenges(status = null, category = null) {
    try {
      let endpoint = "/challenges";
      const params = [];
      if (status) params.push(`status=${status}`);
      if (category) params.push(`category=${category}`);
      if (params.length > 0) endpoint += `?${params.join("&")}`;
      
      return await apiClient.get(endpoint, true);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      throw error;
    }
  }

  // Get challenge by ID
  async getChallengeById(challengeId) {
    try {
      return await apiClient.get(`/challenges/${challengeId}`, true);
    } catch (error) {
      console.error("Failed to fetch challenge:", error);
      throw error;
    }
  }

  // Create a new challenge
  async createChallenge(challengeData) {
    try {
      return await apiClient.post("/challenges", challengeData, true);
    } catch (error) {
      console.error("Failed to create challenge:", error);
      throw error;
    }
  }

  // Join a challenge
  async joinChallenge(challengeId) {
    try {
      return await apiClient.post(`/challenges/${challengeId}/join`, {}, true);
    } catch (error) {
      console.error("Failed to join challenge:", error);
      throw error;
    }
  }

  // Leave a challenge
  async leaveChallenge(challengeId) {
    try {
      return await apiClient.post(`/challenges/${challengeId}/leave`, {}, true);
    } catch (error) {
      console.error("Failed to leave challenge:", error);
      throw error;
    }
  }

  // Update challenge progress
  async updateProgress(challengeId, progress) {
    try {
      return await apiClient.put(
        `/challenges/${challengeId}/progress`,
        { progress },
        true
      );
    } catch (error) {
      console.error("Failed to update progress:", error);
      throw error;
    }
  }

  // Update challenge (only by creator)
  async updateChallenge(challengeId, challengeData) {
    try {
      return await apiClient.put(
        `/challenges/${challengeId}`,
        challengeData,
        true
      );
    } catch (error) {
      console.error("Failed to update challenge:", error);
      throw error;
    }
  }

  // Delete challenge (only by creator)
  async deleteChallenge(challengeId) {
    try {
      return await apiClient.delete(`/challenges/${challengeId}`, true);
    } catch (error) {
      console.error("Failed to delete challenge:", error);
      throw error;
    }
  }
}

export default new ChallengeApi();






