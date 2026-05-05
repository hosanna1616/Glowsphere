import apiClient from "./apiClient";

class QuestApi {
  async getQuests() {
    return apiClient.get("/quests", true);
  }

  async createQuest(payload) {
    return apiClient.post("/quests", payload, true);
  }

  async updateProgress(questId, percentage) {
    return apiClient.put(`/quests/${questId}/progress`, { percentage }, true);
  }

  async supportQuest(questId) {
    return apiClient.post(`/quests/${questId}/support`, {}, true);
  }

  async unsupportQuest(questId) {
    return apiClient.post(`/quests/${questId}/unsupport`, {}, true);
  }

  async addComment(questId, text) {
    return apiClient.post(`/quests/${questId}/comments`, { text }, true);
  }

  async createReminder(payload) {
    return apiClient.post("/quests/reminders", payload, true);
  }

  async getReminders() {
    return apiClient.get("/quests/reminders", true);
  }

  async deleteReminder(reminderId) {
    return apiClient.delete(`/quests/reminders/${reminderId}`, true);
  }
}

export default new QuestApi();
