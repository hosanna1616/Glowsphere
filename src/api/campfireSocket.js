import { io } from "socket.io-client";
import apiClient from "./apiClient";

let socket;

const getSocketBaseUrl = () => {
  const apiBaseUrl = apiClient.getApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
};

export const getCampfireSocket = () => {
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const joinCampfireRoomSocket = (roomId) => {
  const instance = getCampfireSocket();
  instance.emit("join_room", { roomId });
  return instance;
};
