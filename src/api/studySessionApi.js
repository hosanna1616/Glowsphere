import apiClient from "./apiClient";

class StudySessionApi {
  async getSessions() {
    return apiClient.get("/study-sessions", true);
  }

  async getActiveSession() {
    return apiClient.get("/study-sessions/active", true);
  }

  async startSession(payload) {
    return apiClient.post("/study-sessions", payload, true);
  }

  async completeSession(sessionId, payload) {
    return apiClient.put(`/study-sessions/${sessionId}/complete`, payload, true);
  }

  async saveReadingProgress(materialId, payload) {
    return apiClient.post(`/study-sessions/materials/${materialId}/progress`, payload, true);
  }
}

export default new StudySessionApi();
