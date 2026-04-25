import apiClient from "./apiClient";

class LuminaLogsApi {
  async getLogs() {
    return apiClient.get("/lumina-logs", true);
  }

  async createLog(payload) {
    return apiClient.post("/lumina-logs", payload, true);
  }

  async deleteLog(logId) {
    return apiClient.delete(`/lumina-logs/${logId}`, true);
  }
}

export default new LuminaLogsApi();
