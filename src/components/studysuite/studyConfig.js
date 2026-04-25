import apiClient from "../../api/apiClient";

export const resolveStudyMediaUrl = (url) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const apiBaseUrl = apiClient.getApiBaseUrl();
  const serverBaseUrl = apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
  return `${serverBaseUrl}${url}`;
};

export const classicalTracks = [
  {
    key: "mozart",
    name: "Mozart",
    title: "Moonlight Focus",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    key: "beethoven",
    name: "Beethoven",
    title: "Golden Concentration",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    key: "chopin",
    name: "Chopin",
    title: "Velvet Study Glow",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    key: "bach",
    name: "Bach",
    title: "Quiet Pod Flow",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    key: "debussy",
    name: "Debussy",
    title: "Starlit Pages",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    key: "vivaldi",
    name: "Vivaldi",
    title: "Luminous Morning",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
];

export const timerPresets = [25, 50, 90];
export const silentReactions = ["❤️", "🔥", "💪", "🌟"];
