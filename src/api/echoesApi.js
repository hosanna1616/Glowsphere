import apiClient from "./apiClient";

class EchoesApi {
  async getOverview() {
    return apiClient.get("/echoes", true);
  }

  async updateSuitcase(payload) {
    return apiClient.put("/echoes/suitcase", payload, true);
  }

  async addSuitcaseItem(payload) {
    return apiClient.post("/echoes/suitcase/items", payload, true);
  }

  async deleteSuitcaseItem(itemId) {
    return apiClient.delete(`/echoes/suitcase/items/${itemId}`, true);
  }

  async findSoulSister() {
    return apiClient.post("/echoes/matches/find", {}, true);
  }

  async addVoiceNote(matchId, text) {
    return apiClient.post(`/echoes/matches/${matchId}/voice-notes`, { text }, true);
  }

  async deleteVoiceNote(matchId, noteId) {
    return apiClient.delete(`/echoes/matches/${matchId}/voice-notes/${noteId}`, true);
  }

  async saveJointMemory(matchId, payload) {
    return apiClient.put(`/echoes/matches/${matchId}/joint-memory`, payload, true);
  }

  async updateRevealDecision(matchId, decision) {
    return apiClient.put(`/echoes/matches/${matchId}/reveal`, { decision }, true);
  }

  async closeMatch(matchId) {
    return apiClient.delete(`/echoes/matches/${matchId}`, true);
  }

  async createLegacyLetter(payload) {
    return apiClient.post("/echoes/letters", payload, true);
  }

  async deleteLegacyLetter(letterId) {
    return apiClient.delete(`/echoes/letters/${letterId}`, true);
  }
}

export default new EchoesApi();
