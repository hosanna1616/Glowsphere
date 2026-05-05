// Mock API service for user functionality
import apiClient from "./apiClient";

class UserApi {
  // Register a new user
  async register(userData) {
    try {
      const response = await apiClient.post("/auth/register", userData);
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  logout() {
    apiClient.removeToken();
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      return await apiClient.get("/auth/profile", true);
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      return await apiClient.put("/auth/profile", profileData, true);
    } catch (error) {
      throw error;
    }
  }

  async searchUsers(username) {
    try {
      return await apiClient.get(
        `/auth/search?username=${encodeURIComponent(username)}`,
        true,
      );
    } catch (error) {
      throw error;
    }
  }

  async getFriends() {
    try {
      return await apiClient.get("/auth/friends", true);
    } catch (error) {
      throw error;
    }
  }

  async addFriend(username) {
    try {
      return await apiClient.post("/auth/friends", { username }, true);
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(settingsData) {
    return apiClient.put("/auth/settings", settingsData, true);
  }

  async changePassword(currentPassword, newPassword) {
    return apiClient.post(
      "/auth/change-password",
      { currentPassword, newPassword },
      true,
    );
  }

  async logoutAllSessions() {
    return apiClient.post("/auth/logout-all", {}, true);
  }

  async deleteAccount(password) {
    return apiClient.delete("/auth/account", true, { password });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!apiClient.getToken();
  }
}

export default new UserApi();
