import apiClient from "./apiClient";

class NotificationApi {
  // Get user notifications
  async getNotifications() {
    try {
      return await apiClient.get("/notifications", true);
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      return await apiClient.put(
        `/notifications/${notificationId}/read`,
        {},
        true
      );
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      return await apiClient.put("/notifications/read-all", {}, true);
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      return await apiClient.delete(`/notifications/${notificationId}`, true);
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationApi();
