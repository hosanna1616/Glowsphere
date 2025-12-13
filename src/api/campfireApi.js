// Mock API service for Campfire functionality
import apiClient from "./apiClient";

class CampfireApi {
  // Create a new room
  async createRoom(roomData) {
    try {
      return await apiClient.post("/campfire/rooms", roomData, true);
    } catch (error) {
      throw error;
    }
  }

  // Get all rooms
  async getRooms() {
    try {
      return await apiClient.get("/campfire/rooms", true);
    } catch (error) {
      throw error;
    }
  }

  // Get room by ID
  async getRoom(roomId) {
    try {
      return await apiClient.get(`/campfire/rooms/${roomId}`, true);
    } catch (error) {
      throw error;
    }
  }

  // Join a room
  async joinRoom(roomId) {
    try {
      return await apiClient.put(`/campfire/rooms/${roomId}/join`, {}, true);
    } catch (error) {
      throw error;
    }
  }

  // Leave a room
  async leaveRoom(roomId) {
    try {
      return await apiClient.post(`/campfire/rooms/${roomId}/leave`, {}, true);
    } catch (error) {
      throw error;
    }
  }

  // Toggle participant audio
  async toggleParticipantAudio(roomId, userId) {
    try {
      return await apiClient.put(
        `/campfire/rooms/${roomId}/audio`,
        { userId },
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Toggle participant video
  async toggleParticipantVideo(roomId, userId) {
    try {
      return await apiClient.put(
        `/campfire/rooms/${roomId}/video`,
        { userId },
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Get room messages
  async getMessages(roomId) {
    try {
      return await apiClient.get(`/campfire/rooms/${roomId}/messages`, true);
    } catch (error) {
      throw error;
    }
  }

  // Send text message
  async sendTextMessage(roomId, text) {
    try {
      return await apiClient.post(
        `/campfire/rooms/${roomId}/messages/text`,
        { text },
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Send voice message
  async sendVoiceMessage(roomId, voiceData) {
    try {
      // Use FormData for file upload
      const formData = new FormData();
      if (voiceData.audioBlob) {
        // Backend expects field name "voice" not "audio"
        formData.append("voice", voiceData.audioBlob, "voice.webm");
      }
      if (voiceData.duration) {
        formData.append("duration", voiceData.duration.toString());
      }
      
      const token = apiClient.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${apiClient.getApiBaseUrl()}/campfire/rooms/${roomId}/messages/voice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData, browser will set it with boundary
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send voice message: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      // Add voiceUrl to result if not present
      if (voiceData.voiceUrl && !result.voiceUrl) {
        result.voiceUrl = voiceData.voiceUrl;
      }
      return result;
    } catch (error) {
      console.error("Voice message send error:", error);
      throw error;
    }
  }

  // Invite user to room
  async inviteFriend(roomId, username) {
    try {
      return await apiClient.post(
        `/campfire/rooms/${roomId}/invite`,
        { username },
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Update room settings
  async updateRoomSettings(roomId, roomData) {
    try {
      return await apiClient.put(
        `/campfire/rooms/${roomId}`,
        roomData,
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Subscription system for real-time updates
  static subscribers = {};

  static subscribeToRoom(roomId, callback) {
    if (!this.subscribers[roomId]) {
      this.subscribers[roomId] = [];
    }

    this.subscribers[roomId].push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers[roomId] = this.subscribers[roomId].filter(
        (cb) => cb !== callback
      );
    };
  }

  // Notify subscribers of updates
  static notifySubscribers(roomId, data) {
    if (this.subscribers[roomId]) {
      this.subscribers[roomId].forEach((callback) => callback(data));
    }
  }
}

export default new CampfireApi();
