const buildFallbackAvatar = (label, fill) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='${fill}'/><stop offset='100%' stop-color='#7e22ce'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><circle cx='160' cy='160' r='120' fill='rgba(0,0,0,0.25)'/><text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' fill='#fef3c7' font-family='Arial' font-size='96' font-weight='700'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const FIRE_SPIRITS = [
  {
    spiritName: "Rachel",
    actorName: "Jennifer Aniston",
    actorImage: "https://image.tmdb.org/t/p/w500/2daC5DeXqwkFND0xxutbnSVKN6c.jpg",
    fallbackImage: buildFallbackAvatar("R", "#f59e0b"),
  },
  {
    spiritName: "Monica",
    actorName: "Courteney Cox",
    actorImage: "https://image.tmdb.org/t/p/w500/z6UPXvL6dI6l8n5M6P7m6B2Jx2P.jpg",
    fallbackImage: buildFallbackAvatar("M", "#ec4899"),
  },
  {
    spiritName: "Chandler",
    actorName: "Matthew Perry",
    actorImage: "https://image.tmdb.org/t/p/w500/rQf4tM6f1Y6n9fQ9Z2G0Y2U7A0n.jpg",
    fallbackImage: buildFallbackAvatar("C", "#a855f7"),
  },
  {
    spiritName: "Phoebe",
    actorName: "Lisa Kudrow",
    actorImage: "https://image.tmdb.org/t/p/w500/f6j9r2tQ7P1p3xK6w3M8n9L5y1K.jpg",
    fallbackImage: buildFallbackAvatar("P", "#fb7185"),
  },
  {
    spiritName: "Joey",
    actorName: "Matt LeBlanc",
    actorImage: "https://image.tmdb.org/t/p/w500/4L9R4u8v0W6W5b8Y3x8F6W0e5Wk.jpg",
    fallbackImage: buildFallbackAvatar("J", "#f97316"),
  },
  {
    spiritName: "Ross",
    actorName: "David Schwimmer",
    actorImage: "https://image.tmdb.org/t/p/w500/gI2w2tY3L5Q2m4A7n7Q2T0o5V4g.jpg",
    fallbackImage: buildFallbackAvatar("R", "#38bdf8"),
  },
].map((spirit) => ({
  ...spirit,
  iconImage: "/glowsphere-logo.svg",
}));

export const FIRE_SPIRIT_BY_NAME = FIRE_SPIRITS.reduce((acc, spirit) => {
  acc[spirit.spiritName] = spirit;
  return acc;
}, {});
