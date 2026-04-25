import { io } from "socket.io-client";
import apiClient from "./apiClient";

let socket;

const getSocketBaseUrl = () => {
  const apiBaseUrl = apiClient.getApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
};

export const getStudySocket = () => {
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const joinStudyPodRoom = (podId) => {
  const instance = getStudySocket();
  instance.emit("join_study_pod", { podId });
  return instance;
};
