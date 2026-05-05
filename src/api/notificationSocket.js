import { io } from "socket.io-client";
import apiClient from "./apiClient";

let notificationSocket;

const getSocketBaseUrl = () => {
  const apiBaseUrl = apiClient.getApiBaseUrl();
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
};

export const getNotificationSocket = () => {
  if (!notificationSocket) {
    notificationSocket = io(getSocketBaseUrl(), {
      transports: ["websocket", "polling"],
    });
  }
  return notificationSocket;
};

export const registerNotificationSocketUser = (userId) => {
  if (!userId) return null;
  const socket = getNotificationSocket();
  socket.emit("auth:user", { userId });
  return socket;
};

