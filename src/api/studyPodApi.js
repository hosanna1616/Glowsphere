import apiClient from "./apiClient";

class StudyPodApi {
  async listPods() {
    return apiClient.get("/study-pods", true);
  }

  async getPod(podId) {
    return apiClient.get(`/study-pods/${podId}`, true);
  }

  async createPod(payload) {
    return apiClient.post("/study-pods", payload, true);
  }

  async joinPod(podId) {
    return apiClient.post(`/study-pods/${podId}/join`, {}, true);
  }

  async inviteToPod(podId, username) {
    return apiClient.post(`/study-pods/${podId}/invite`, { username }, true);
  }

  async respondToInvite(podId, action) {
    return apiClient.post(`/study-pods/${podId}/invite/respond`, { action }, true);
  }

  async updateProgress(podId, coveragePercent) {
    return apiClient.post(`/study-pods/${podId}/progress`, { coveragePercent }, true);
  }

  async startSession(podId, payload) {
    return apiClient.post(`/study-pods/${podId}/session/start`, payload, true);
  }

  async openDebrief(podId) {
    return apiClient.post(`/study-pods/${podId}/session/debrief`, {}, true);
  }

  async sendReaction(podId, emoji) {
    return apiClient.post(`/study-pods/${podId}/reactions`, { emoji }, true);
  }

  async sendDebriefText(podId, message) {
    return apiClient.post(`/study-pods/${podId}/debrief/text`, { message }, true);
  }

  async sendDebriefVoice(podId, audioBlob, durationSeconds) {
    const token = apiClient.getToken();
    const formData = new FormData();
    formData.append("voice", audioBlob, "glow-debrief.webm");
    formData.append("durationSeconds", `${durationSeconds || 0}`);

    const response = await fetch(`${apiClient.getApiBaseUrl()}/study-pods/${podId}/debrief/voice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to send voice note");
    }

    return response.json();
  }
}

export default new StudyPodApi();
