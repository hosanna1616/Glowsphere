import apiClient from "./apiClient";

class ParallelBloomApi {
  getState() {
    return apiClient.get("/parallel-bloom", true);
  }

  saveOnboarding(body) {
    return apiClient.post("/parallel-bloom/onboarding", body, true);
  }

  saveRediscover(body) {
    return apiClient.post("/parallel-bloom/rediscover", body, true);
  }

  getPath(pathId) {
    return apiClient.get(`/parallel-bloom/paths/${encodeURIComponent(pathId)}`, true);
  }

  explorePath(pathId) {
    return apiClient.post(
      `/parallel-bloom/explore/${encodeURIComponent(pathId)}`,
      {},
      true,
    );
  }

  saveReflection(body) {
    return apiClient.post("/parallel-bloom/reflection", body, true);
  }

  compare(pathIds) {
    return apiClient.post("/parallel-bloom/compare", { pathIds }, true);
  }

  getDaily() {
    return apiClient.get("/parallel-bloom/daily", true);
  }

  addCapsule(body) {
    return apiClient.post("/parallel-bloom/capsules", body, true);
  }

  deleteCapsule(capsuleId) {
    return apiClient.delete(
      `/parallel-bloom/capsules/${encodeURIComponent(capsuleId)}`,
      true,
    );
  }
}

export default new ParallelBloomApi();
