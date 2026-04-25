const { PATHS, PATH_BY_ID } = require("../data/parallelBloomPaths");

const ENERGY_KEYS = ["creating", "helping", "leading", "solving", "expressing", "exploring"];
const VALUE_KEYS = ["calm", "adventure", "status", "freedom", "impact", "creativity", "stability"];

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function normalizeOnboarding(raw = {}) {
  const energyStyle = ENERGY_KEYS.includes(raw.energyStyle) ? raw.energyStyle : "exploring";
  const values = Array.isArray(raw.values) ? raw.values.filter((v) => VALUE_KEYS.includes(v)) : [];
  return {
    lifeExcitement: String(raw.lifeExcitement || "").slice(0, 2000),
    energyStyle,
    drains: String(raw.drains || "").slice(0, 2000),
    environmentsAlive: String(raw.environmentsAlive || "").slice(0, 2000),
    values,
  };
}

function normalizeRediscover(raw = {}) {
  const allowed = ["peace", "power", "creativity", "freedom", "security", "recognition"];
  const coreWant = allowed.includes(raw.coreWant) ? raw.coreWant : "creativity";
  return {
    beforePressure: String(raw.beforePressure || "").slice(0, 2000),
    childLove: String(raw.childLove || "").slice(0, 2000),
    confidentWhen: String(raw.confidentWhen || "").slice(0, 2000),
    noJudgmentTry: String(raw.noJudgmentTry || "").slice(0, 2000),
    coreWant,
  };
}

function valueBoostScore(path, values) {
  if (!values.length) return 0.55;
  let sum = 0;
  for (const v of values) {
    sum += path.valueBoost[v] ?? 0.5;
  }
  return sum / values.length;
}

function baseScore(path, onboarding) {
  const e = onboarding.energyStyle;
  const affinity = path.affinity[e] ?? 0.5;
  const vb = valueBoostScore(path, onboarding.values);
  return affinity * 0.62 + vb * 0.38;
}

function rediscoverBoost(path, rediscover) {
  if (!rediscover || !rediscover.coreWant) return 0;
  const map = {
    peace: ["wellness-coach", "teacher-mentor", "writer-storyteller"],
    power: ["lawyer-advocate", "finance-leader", "media-personality"],
    creativity: ["designer-creative-director", "artist-musician", "writer-storyteller", "ux-product-designer"],
    freedom: ["global-traveler-remote", "software-engineer", "entrepreneur-founder"],
    security: ["doctor-healer", "finance-leader", "scientist-researcher"],
    recognition: ["media-personality", "designer-creative-director", "lawyer-advocate"],
  };
  const ids = map[rediscover.coreWant] || [];
  return ids.includes(path.id) ? 0.08 : 0;
}

function reflectionBoost(path, exploredPaths) {
  let boost = 0;
  for (const ex of exploredPaths || []) {
    if (ex.pathId !== path.id || !ex.reflection) continue;
    const r = ex.reflection;
    const like = String(r.likeYouOrOther || "").toLowerCase();
    if (like.includes("me") || like.includes("mine") || like === "you") boost += 0.06;
    const heavy = String(r.heavyOrEnergizing || "").toLowerCase();
    if (heavy.includes("energy") || heavy.includes("light")) boost += 0.03;
    const daily = String(r.dailyImagine || r.daily || "").toLowerCase();
    if (daily.includes("yes") || daily.includes("could")) boost += 0.03;
  }
  return clamp(boost, 0, 0.2);
}

function scorePath(path, onboarding, rediscover, exploredPaths) {
  const ob = typeof onboarding.energyStyle === "string" ? onboarding : normalizeOnboarding(onboarding);
  let s = baseScore(path, ob) + rediscoverBoost(path, rediscover) + reflectionBoost(path, exploredPaths);
  return clamp(s, 0, 1);
}

function personalityFit1to10(path, onboarding, rediscover, exploredPaths) {
  const s = scorePath(path, onboarding, rediscover, exploredPaths);
  return clamp(Math.round(1 + s * 9), 1, 10);
}

function explainMatch(path, onboarding, score) {
  const parts = [];
  parts.push(
    `Your energy style (${onboarding.energyStyle}) lines up with how this path spends a typical week.`,
  );
  if (onboarding.values?.length) {
    parts.push(
      `Your values (${onboarding.values.join(", ")}) overlap with this path’s lifestyle and tradeoffs.`,
    );
  }
  parts.push(
    `Fit score ${Math.round(score * 100)}% — a mirror, not a verdict. You can rewrite your story anytime.`,
  );
  return parts.join(" ");
}

function rankPaths(onboarding, rediscover, exploredPaths, limit = 5) {
  const ob = normalizeOnboarding(onboarding);
  const scored = PATHS.map((p) => {
    const s = scorePath(p, ob, rediscover, exploredPaths);
    return {
      pathId: p.id,
      title: p.title,
      score: s,
      why: explainMatch(p, ob, s),
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function summarizePath(p) {
  return {
    id: p.id,
    title: p.title,
    shortTag: p.shortTag,
    headline: p.headline,
    ambiance: p.ambiance,
    voiceNote: p.voiceNote,
    traits: p.traits,
  };
}

function getPathDetail(pathId) {
  const p = PATH_BY_ID[pathId];
  if (!p) return null;
  return {
    ...summarizePath(p),
    compare: { ...p.compare },
    daySimulation: p.daySimulation,
  };
}

function comparePaths(pathIds, profile) {
  const ids = (pathIds || []).slice(0, 3);
  const rows = [];
  const onboarding = profile?.onboarding || {};
  const rediscover = profile?.rediscover || {};
  const explored = profile?.exploredPaths || [];

  for (const id of ids) {
    const p = PATH_BY_ID[id];
    if (!p) continue;
    const personalityFit = personalityFit1to10(p, onboarding, rediscover, explored);
    rows.push({
      id: p.id,
      title: p.title,
      shortTag: p.shortTag,
      compare: { ...p.compare, personalityFit },
      headline: p.headline,
    });
  }
  return rows;
}

const DAILY_KINDS = [
  "path_suggestion",
  "confidence",
  "journal",
  "talent",
  "scene",
  "skill",
];

function dailyDigest(profile) {
  const idx =
    profile?.dailyState?.rotationIndex != null
      ? profile.dailyState.rotationIndex % DAILY_KINDS.length
      : 0;
  const kind = DAILY_KINDS[idx];
  const top = rankPaths(
    profile.onboarding || {},
    profile.rediscover || {},
    profile.exploredPaths || [],
    1,
  )[0];
  const suggestPath = top?.pathId ? PATH_BY_ID[top.pathId] : PATHS[idx % PATHS.length];

  const healthcareHint =
    (profile?.onboarding?.values || []).includes("impact") &&
    (profile?.onboarding?.energyStyle === "helping" || profile?.onboarding?.energyStyle === "solving");

  const payloads = {
    path_suggestion: {
      title: "Today’s parallel",
      body: `Explore “${suggestPath?.title || "a new path"}” — ${suggestPath?.headline || ""}`,
      ctaPathId: suggestPath?.id,
    },
    confidence: {
      title: "Confidence challenge",
      body: "Name one strength you used this week — even quietly. That counts.",
    },
    journal: {
      title: "Self-discovery prompt",
      body: "What would you try for seven days if failure felt safe?",
    },
    talent: {
      title: "Hidden talent signal",
      body: healthcareHint
        ? "You scored high in empathy and steadiness. Want to explore healthcare futures?"
        : "You notice patterns when you care — that transfers across many careers.",
    },
    scene: {
      title: "Future scene",
      body: suggestPath?.daySimulation?.[0]?.scene
        ? `Imagine: ${suggestPath.daySimulation[0].scene}`
        : "Picture a morning where your work fits your nervous system.",
    },
    skill: {
      title: "Skill to sample",
      body: "Try 20 minutes of structured writing or one short tutorial — low stakes, high signal.",
    },
  };

  return {
    kind,
    date: new Date().toISOString().slice(0, 10),
    streak: profile?.dailyState?.streak || 0,
    ...payloads[kind],
  };
}

function nextRotationIndex(current) {
  return (current || 0) + 1;
}

module.exports = {
  PATHS,
  PATH_BY_ID,
  ENERGY_KEYS,
  VALUE_KEYS,
  normalizeOnboarding,
  normalizeRediscover,
  rankPaths,
  summarizePath,
  getPathDetail,
  comparePaths,
  dailyDigest,
  nextRotationIndex,
  DAILY_KINDS,
  scorePath,
  personalityFit1to10,
};
