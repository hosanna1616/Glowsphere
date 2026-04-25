import apiClient from "../api/apiClient";

const getServerBaseUrl = () => {
  const apiBase = apiClient.getApiBaseUrl();
  return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
};

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  const normalized = url.replace(/\\/g, "/");

  if (normalized.startsWith("/uploads/")) {
    return `${getServerBaseUrl()}${normalized}`;
  }

  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  if (uploadsIndex !== -1) {
    const relativeUploadsPath = normalized.slice(uploadsIndex);
    return `${getServerBaseUrl()}${relativeUploadsPath}`;
  }

  if (normalized.startsWith("/")) {
    return `${apiClient.getApiBaseUrl()}${normalized}`;
  }

  return `${getServerBaseUrl()}/uploads/${normalized}`;
};
