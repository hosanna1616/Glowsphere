import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  GitCompare,
  Heart,
  Sun,
  ListOrdered,
  ChevronRight,
  Bookmark,
  Trash2,
  Flower2,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import ParallelBloomApi from "../../api/parallelBloomApi";

const ENERGY_OPTIONS = [
  { id: "creating", label: "Creating" },
  { id: "helping", label: "Helping" },
  { id: "leading", label: "Leading" },
  { id: "solving", label: "Solving" },
  { id: "expressing", label: "Expressing" },
  { id: "exploring", label: "Exploring" },
];

const VALUE_OPTIONS = [
  { id: "calm", label: "Calm" },
  { id: "adventure", label: "Adventure" },
  { id: "status", label: "Recognition" },
  { id: "freedom", label: "Freedom" },
  { id: "impact", label: "Impact" },
  { id: "creativity", label: "Creativity" },
  { id: "stability", label: "Stability" },
];

const CORE_WANT = [
  { id: "peace", label: "Peace" },
  { id: "power", label: "Power" },
  { id: "creativity", label: "Creativity" },
  { id: "freedom", label: "Freedom" },
  { id: "security", label: "Security" },
  { id: "recognition", label: "Recognition" },
];

const COMPARE_LABELS = {
  salaryPotential: "Salary potential",
  flexibility: "Flexibility",
  stress: "Stress level",
  educationYears: "Education (years)",
  creativity: "Creativity",
  travelFreedom: "Travel freedom",
  socialImpact: "Social impact",
  workLifeBalance: "Work–life balance",
  personalityFit: "Personality fit (for you)",
};

function onboardingDone(ob) {
  return (
    ob &&
    ob.energyStyle &&
    (ob.values?.length > 0 || String(ob.lifeExcitement || "").trim().length > 2)
  );
}

function MetricBar({ label, value, max = 10 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-rose-100/60">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-800/80 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-rose-900/80 via-amber-500/90 to-amber-300/90"
        />
      </div>
    </div>
  );
}

export default function ParallelBloom() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [tab, setTab] = useState("paths");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [form, setForm] = useState({
    lifeExcitement: "",
    energyStyle: "exploring",
    drains: "",
    environmentsAlive: "",
    values: [],
  });
  const [rediscover, setRediscover] = useState({
    beforePressure: "",
    childLove: "",
    confidentWhen: "",
    noJudgmentTry: "",
    coreWant: "creativity",
  });
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [pathDetail, setPathDetail] = useState(null);
  const [compareIds, setCompareIds] = useState([null, null, null]);
  const [compareResult, setCompareResult] = useState(null);
  const [daily, setDaily] = useState(null);
  const [reflection, setReflection] = useState({
    excited: 4,
    heavyOrEnergizing: "",
    dailyImagine: "",
    likeYouOrOther: "",
    attractedMost: "",
  });
  const [capsuleNote, setCapsuleNote] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ParallelBloomApi.getState();
      setProfile(data.profile);
      setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
      setTopMatches(Array.isArray(data.topMatches) ? data.topMatches : []);
      if (data.profile?.onboarding) {
        setForm((f) => ({ ...f, ...data.profile.onboarding }));
      }
      if (data.profile?.rediscover) {
        setRediscover((r) => ({ ...r, ...data.profile.rediscover }));
      }
    } catch (e) {
      showToast(e.message || "Could not load Parallel Bloom", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const showOnboarding = useMemo(
    () => profile && !onboardingDone(profile.onboarding),
    [profile],
  );

  const submitOnboarding = async (e) => {
    e.preventDefault();
    try {
      const data = await ParallelBloomApi.saveOnboarding(form);
      setProfile(data.profile);
      setTopMatches(data.topMatches || []);
      showToast("Your paths are blooming from what feels true to you.", "success");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
  };

  const submitRediscover = async (e) => {
    e.preventDefault();
    try {
      const data = await ParallelBloomApi.saveRediscover(rediscover);
      setProfile(data.profile);
      setTopMatches(data.topMatches || []);
      showToast("Aligned with the self you remember.", "success");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
  };

  const openPath = async (pathId) => {
    setSelectedPathId(pathId);
    setPathDetail(null);
    setCapsuleNote("");
    try {
      const d = await ParallelBloomApi.getPath(pathId);
      setPathDetail(d);
      setTab("explore");
    } catch (err) {
      showToast(err.message || "Could not load path", "error");
    }
  };

  const enterParallel = async () => {
    if (!selectedPathId) return;
    try {
      const data = await ParallelBloomApi.explorePath(selectedPathId);
      setProfile(data.profile);
      if (data.path) setPathDetail(data.path);
      showToast("You stepped into a parallel future.", "success");
    } catch (err) {
      showToast(err.message || "Explore failed", "error");
    }
  };

  const submitReflection = async (e) => {
    e.preventDefault();
    if (!selectedPathId) return;
    try {
      const data = await ParallelBloomApi.saveReflection({
        pathId: selectedPathId,
        reflection,
      });
      setProfile(data.profile);
      setTopMatches(data.topMatches || []);
      showToast("Saved. Your matches learn from this — gently.", "success");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
  };

  const runCompare = async () => {
    const ids = compareIds.filter(Boolean);
    if (ids.length < 2) {
      showToast("Pick at least two futures to compare.", "warning");
      return;
    }
    try {
      const data = await ParallelBloomApi.compare(ids);
      setCompareResult(data.compare || []);
      showToast("Your parallels, side by side.", "success");
    } catch (err) {
      showToast(err.message || "Compare failed", "error");
    }
  };

  const fetchDaily = async () => {
    try {
      const data = await ParallelBloomApi.getDaily();
      setDaily(data.daily);
      setProfile(data.profile);
      setTab("daily");
    } catch (err) {
      showToast(err.message || "Could not load today’s card", "error");
    }
  };

  const saveCapsule = async () => {
    if (!selectedPathId) return;
    try {
      const data = await ParallelBloomApi.addCapsule({
        pathId: selectedPathId,
        note: capsuleNote,
      });
      setProfile(data.profile);
      setCapsuleNote("");
      showToast("Sealed in your Future Capsules.", "success");
    } catch (err) {
      showToast(err.message || "Could not save capsule", "error");
    }
  };

  const removeCapsule = async (id) => {
    try {
      const data = await ParallelBloomApi.deleteCapsule(id);
      setProfile(data.profile);
      showToast("Capsule removed.", "info");
    } catch (err) {
      showToast(err.message || "Delete failed", "error");
    }
  };

  const toggleValue = (id) => {
    setForm((f) => {
      const has = f.values.includes(id);
      return {
        ...f,
        values: has ? f.values.filter((v) => v !== id) : [...f.values, id],
      };
    });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-rose-100/80">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Flower2 className="w-10 h-10 text-amber-400/80" />
        </motion.div>
        Opening parallel futures…
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 relative">
      <div className="pointer-events-none absolute inset-x-0 -top-4 h-48 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,113,133,0.12),transparent_55%)]" />

      <div className="flex items-center justify-between gap-3 mb-6 relative">
        <button
          type="button"
          onClick={() => navigate("/glowchallenge")}
          className="text-amber-300 hover:text-amber-200"
          aria-label="Back to challenges"
        >
          ←
        </button>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.25em] text-rose-200/50">
            Parallel Bloom
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-100 via-amber-200 to-amber-400">
            Future Paths
          </h1>
        </div>
      </div>

      <p className="text-sm text-rose-50/85 mb-8 leading-relaxed relative border-l-2 border-amber-500/30 pl-4">
        <span className="italic text-amber-100/95">“I can actually see who I could become.”</span>
        <br />
        <span className="text-rose-100/75">
          Explore futures that feel cinematic and real — then choose from alignment, not pressure.
        </span>
      </p>
      <p className="text-[11px] text-rose-200/55 mb-8 leading-relaxed">
        While you are signed in, onboarding, reflections, daily cards, and Future Capsules are stored
        on the server via the API — the same data reloads when you open this page again.
      </p>

      <AnimatePresence mode="wait">
        {showOnboarding && (
          <motion.form
            key="onboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={submitOnboarding}
            className="relative rounded-3xl border border-rose-500/20 bg-gradient-to-b from-stone-950/90 to-stone-950/50 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_60px_rgba(251,113,133,0.08)] overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="relative flex items-center gap-2 mb-5 text-rose-100">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="font-medium tracking-tight">Discover mood + identity</span>
            </div>
            <p className="relative text-xs text-rose-200/60 mb-4">
              No grades here — just gentle questions. Take your time.
            </p>
            <div className="relative flex gap-2 mb-6">
              {[0, 1, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOnboardingStep(s)}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    onboardingStep === s ? "bg-gradient-to-r from-rose-500 to-amber-400" : "bg-stone-800"
                  }`}
                />
              ))}
            </div>

            {onboardingStep === 0 && (
              <div className="relative space-y-4">
                <label className="block text-sm text-rose-50/90">
                  What kind of life feels exciting to you?
                  <textarea
                    className="mt-2 w-full rounded-2xl bg-stone-900/70 border border-rose-500/15 p-3 text-rose-50 placeholder:text-rose-300/25 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[100px]"
                    value={form.lifeExcitement}
                    onChange={(e) => setForm({ ...form, lifeExcitement: e.target.value })}
                    placeholder="Soft and honest — there’s no wrong answer."
                  />
                </label>
                <label className="block text-sm text-rose-50/90">
                  What drains you lately?
                  <textarea
                    className="mt-2 w-full rounded-2xl bg-stone-900/70 border border-rose-500/15 p-3 text-rose-50 placeholder:text-rose-300/25 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[80px]"
                    value={form.drains}
                    onChange={(e) => setForm({ ...form, drains: e.target.value })}
                    placeholder="Pressure, noise, comparison…"
                  />
                </label>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="relative space-y-4">
                <p className="text-sm text-rose-50/90">
                  What do you lean toward most days?
                </p>
                <div className="flex flex-wrap gap-2">
                  {ENERGY_OPTIONS.map((o) => (
                    <motion.button
                      key={o.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setForm({ ...form, energyStyle: o.id })}
                      className={`px-3 py-2 rounded-full text-sm border transition-all ${
                        form.energyStyle === o.id
                          ? "bg-gradient-to-r from-amber-600 to-rose-500 text-white border-transparent shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                          : "border-rose-500/25 text-rose-100/90 hover:border-amber-400/40 bg-stone-900/40"
                      }`}
                    >
                      {o.label}
                    </motion.button>
                  ))}
                </div>
                <label className="block text-sm text-rose-50/90">
                  What environments make you feel alive?
                  <textarea
                    className="mt-2 w-full rounded-2xl bg-stone-900/70 border border-rose-500/15 p-3 text-rose-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[80px]"
                    value={form.environmentsAlive}
                    onChange={(e) =>
                      setForm({ ...form, environmentsAlive: e.target.value })
                    }
                  />
                </label>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="relative space-y-3">
                <p className="text-sm text-rose-50/90">What do you want more of? (pick any)</p>
                <div className="flex flex-wrap gap-2">
                  {VALUE_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleValue(o.id)}
                      className={`px-3 py-2 rounded-full text-sm border transition-all ${
                        form.values.includes(o.id)
                          ? "bg-rose-500/20 border-amber-400/50 text-amber-50"
                          : "border-rose-500/20 text-rose-100/80 hover:border-amber-400/40"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative flex justify-between mt-8 gap-3">
              {onboardingStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep((s) => Math.max(0, s - 1))}
                  className="text-rose-300/80 hover:text-rose-200 text-sm"
                >
                  Back
                </button>
              ) : (
                <span />
              )}
              {onboardingStep < 2 ? (
                <button
                  type="button"
                  onClick={() => setOnboardingStep((s) => s + 1)}
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full bg-gold-gradient text-black font-semibold text-sm shadow-[0_0_24px_rgba(251,191,36,0.35)]"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-6 py-2.5 rounded-full bg-gold-gradient text-black font-semibold text-sm shadow-[0_0_24px_rgba(251,191,36,0.35)]"
                >
                  Save & see paths
                </button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showOnboarding && (
        <>
          <div className="flex flex-wrap gap-2 mb-6 relative">
            {[
              { id: "paths", label: "Paths", icon: Compass },
              { id: "explore", label: "Explore", icon: Sparkles },
              { id: "compare", label: "Compare", icon: GitCompare },
              { id: "rediscover", label: "Rediscover", icon: Heart },
              { id: "daily", label: "Today", icon: Sun },
              { id: "capsules", label: "Capsules", icon: Bookmark },
              { id: "matches", label: "Matches", icon: ListOrdered },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm border transition-all ${
                  tab === t.id
                    ? "bg-rose-500/15 border-amber-400/50 text-amber-50 shadow-[0_0_20px_rgba(251,113,133,0.12)]"
                    : "border-rose-500/20 text-rose-100/75 hover:border-amber-400/35"
                }`}
              >
                <t.icon className="w-3.5 h-3.5 opacity-90" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "paths" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-3 sm:gap-4"
            >
              {catalog.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openPath(c.id)}
                  className="text-left rounded-3xl border border-rose-500/15 bg-gradient-to-br from-stone-900/85 via-stone-950/90 to-rose-950/20 p-4 sm:p-5 hover:border-amber-400/35 transition-all shadow-[0_0_40px_rgba(0,0,0,0.35)] hover:shadow-[0_0_50px_rgba(251,113,133,0.08)]"
                >
                  <div className="flex justify-between gap-2 items-start">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-rose-200/45">
                        Future self · {c.shortTag}
                      </p>
                      <h3 className="text-lg font-semibold text-rose-50 mt-1">{c.title}</h3>
                      <p className="text-sm text-rose-100/75 mt-2 leading-relaxed">{c.headline}</p>
                    </div>
                    <span className="text-amber-400/90 text-xl shrink-0">→</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.traits?.map((tr) => (
                      <span
                        key={tr}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-100/90 border border-amber-500/15"
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {tab === "explore" && pathDetail && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="rounded-3xl border border-amber-500/25 bg-stone-950/75 p-5 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.14),_transparent_55%)]" />
                <p className="text-[10px] uppercase tracking-[0.25em] text-rose-200/50 relative">
                  A day in your life at 28
                </p>
                <h2 className="text-xl font-semibold text-rose-50 mt-1 relative">{pathDetail.title}</h2>
                <p className="text-sm text-rose-100/85 mt-2 relative leading-relaxed">{pathDetail.headline}</p>
                <p className="text-xs text-amber-200/55 mt-2 relative">{pathDetail.ambiance}</p>
              </div>

              <button
                type="button"
                onClick={enterParallel}
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-semibold text-sm shadow-[0_0_28px_rgba(251,191,36,0.3)]"
              >
                Enter this parallel
              </button>

              <div className="rounded-3xl border border-rose-400/25 bg-gradient-to-br from-rose-950/40 to-stone-950/60 p-5">
                <p className="text-sm text-rose-50/95 italic leading-relaxed">“{pathDetail.voiceNote}”</p>
                <p className="text-[10px] uppercase tracking-wider text-rose-200/45 mt-3">Future voice note</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-amber-200/90">Morning → night</h3>
                {pathDetail.daySimulation?.map((block, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl border border-rose-500/10 bg-stone-900/45 p-4"
                  >
                    <div className="flex justify-between items-center mb-2 gap-2">
                      <span className="text-xs font-semibold text-amber-300/95">{block.phase}</span>
                      <span className="text-[10px] text-rose-200/50 whitespace-nowrap">
                        stress {block.stress}/10 · impact {block.impact}/10 · energy {block.energy}/10
                      </span>
                    </div>
                    <p className="text-sm text-rose-50/95 leading-relaxed">{block.scene}</p>
                    <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs text-rose-100/80">
                      <p>
                        <span className="text-rose-300/50">Wear · </span>
                        {block.wear}
                      </p>
                      <p>
                        <span className="text-rose-300/50">Work · </span>
                        {block.work}
                      </p>
                      <p>
                        <span className="text-rose-300/50">People · </span>
                        {block.people}
                      </p>
                      <p>
                        <span className="text-rose-300/50">Life · </span>
                        {block.lifestyle}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <form
                onSubmit={submitReflection}
                className="rounded-3xl border border-rose-500/20 bg-stone-950/55 p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-rose-100">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-sm">Mirror reflection</span>
                </div>
                <p className="text-xs text-rose-200/60 -mt-2">
                  Your answers tune recommendations — nothing is judged.
                </p>
                <label className="block text-xs text-rose-100/85">
                  Did this future excite you? (1–5)
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={reflection.excited}
                    onChange={(e) =>
                      setReflection({ ...reflection, excited: Number(e.target.value) })
                    }
                    className="w-full mt-2 accent-amber-500"
                  />
                </label>
                <label className="block text-xs text-rose-100/85">
                  Heavy or energizing?
                  <input
                    className="mt-1 w-full rounded-xl bg-stone-900/80 border border-rose-500/15 p-2.5 text-sm text-rose-50"
                    value={reflection.heavyOrEnergizing}
                    onChange={(e) =>
                      setReflection({ ...reflection, heavyOrEnergizing: e.target.value })
                    }
                    placeholder="Energizing, heavy, mixed…"
                  />
                </label>
                <label className="block text-xs text-rose-100/85">
                  Could you imagine doing this most days?
                  <input
                    className="mt-1 w-full rounded-xl bg-stone-900/80 border border-rose-500/15 p-2.5 text-sm text-rose-50"
                    value={reflection.dailyImagine}
                    onChange={(e) =>
                      setReflection({ ...reflection, dailyImagine: e.target.value })
                    }
                  />
                </label>
                <label className="block text-xs text-rose-100/85">
                  Did this feel like YOU or someone else’s dream?
                  <input
                    className="mt-1 w-full rounded-xl bg-stone-900/80 border border-rose-500/15 p-2.5 text-sm text-rose-50"
                    value={reflection.likeYouOrOther}
                    onChange={(e) =>
                      setReflection({ ...reflection, likeYouOrOther: e.target.value })
                    }
                  />
                </label>
                <label className="block text-xs text-rose-100/85">
                  What attracted you most?
                  <textarea
                    className="mt-1 w-full rounded-xl bg-stone-900/80 border border-rose-500/15 p-2.5 text-sm text-rose-50 min-h-[72px]"
                    value={reflection.attractedMost}
                    onChange={(e) =>
                      setReflection({ ...reflection, attractedMost: e.target.value })
                    }
                  />
                </label>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full border border-amber-400/35 text-amber-50 hover:bg-amber-500/10 text-sm font-medium transition-colors"
                >
                  Save mirror & refresh matches
                </button>
              </form>

              <div className="rounded-3xl border border-amber-500/15 bg-stone-900/35 p-4">
                <p className="text-xs text-rose-200/65 mb-2">Future capsule — private keep</p>
                <textarea
                  className="w-full rounded-2xl bg-stone-950/80 border border-rose-500/15 p-3 text-sm text-rose-50 min-h-[64px]"
                  placeholder="A line you want to remember…"
                  value={capsuleNote}
                  onChange={(e) => setCapsuleNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={saveCapsule}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
                >
                  <Bookmark className="w-4 h-4" />
                  Save capsule
                </button>
              </div>
            </motion.div>
          )}

          {tab === "explore" && !pathDetail && (
            <p className="text-rose-200/70 text-sm">
              Choose a path from <strong>Paths</strong> for a full day simulation and mirror
              prompts.
            </p>
          )}

          {tab === "compare" && (
            <div className="space-y-4">
              <p className="text-sm text-rose-100/80 leading-relaxed">
                Pick two or three futures. We chart salary feel, flexibility, stress, study years,
                creativity, travel, impact, balance, and <strong>personality fit for you</strong>.
              </p>
              {[0, 1, 2].map((slot) => (
                <select
                  key={slot}
                  className="w-full rounded-2xl bg-stone-900/80 border border-rose-500/15 p-3 text-sm text-rose-50"
                  value={compareIds[slot] || ""}
                  onChange={(e) => {
                    const next = [...compareIds];
                    next[slot] = e.target.value || null;
                    setCompareIds(next);
                  }}
                >
                  <option value="">Slot {slot + 1} — optional</option>
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              ))}
              <button
                type="button"
                onClick={runCompare}
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-semibold text-sm shadow-[0_0_24px_rgba(251,191,36,0.28)]"
              >
                Compare parallels
              </button>

              {compareResult?.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {compareResult.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-3xl border border-rose-500/15 bg-stone-950/65 p-4 space-y-3"
                    >
                      <h4 className="text-sm font-semibold text-rose-50">{row.shortTag}</h4>
                      <p className="text-[11px] text-rose-200/70 leading-relaxed">{row.headline}</p>
                      {row.compare &&
                        Object.entries(row.compare).map(([k, v]) => (
                          <MetricBar
                            key={k}
                            label={COMPARE_LABELS[k] || k}
                            value={v}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "rediscover" && (
            <form
              onSubmit={submitRediscover}
              className="rounded-3xl border border-rose-500/20 bg-stone-950/60 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-100 mb-1">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="font-medium">Rediscover yourself</span>
              </div>
              <label className="block text-xs text-rose-100/85">
                Who were you before pressure changed you?
                <textarea
                  className="mt-1 w-full rounded-2xl bg-stone-900/75 border border-rose-500/15 p-3 text-sm min-h-[72px]"
                  value={rediscover.beforePressure}
                  onChange={(e) =>
                    setRediscover({ ...rediscover, beforePressure: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs text-rose-100/85">
                What did you naturally love as a child?
                <textarea
                  className="mt-1 w-full rounded-2xl bg-stone-900/75 border border-rose-500/15 p-3 text-sm min-h-[72px]"
                  value={rediscover.childLove}
                  onChange={(e) =>
                    setRediscover({ ...rediscover, childLove: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs text-rose-100/85">
                When do you feel most confident?
                <textarea
                  className="mt-1 w-full rounded-2xl bg-stone-900/75 border border-rose-500/15 p-3 text-sm min-h-[56px]"
                  value={rediscover.confidentWhen}
                  onChange={(e) =>
                    setRediscover({ ...rediscover, confidentWhen: e.target.value })
                  }
                />
              </label>
              <label className="block text-xs text-rose-100/85">
                If nobody judged you, what would you try?
                <textarea
                  className="mt-1 w-full rounded-2xl bg-stone-900/75 border border-rose-500/15 p-3 text-sm min-h-[72px]"
                  value={rediscover.noJudgmentTry}
                  onChange={(e) =>
                    setRediscover({ ...rediscover, noJudgmentTry: e.target.value })
                  }
                />
              </label>
              <p className="text-xs text-rose-100/80">What do you crave most underneath?</p>
              <div className="flex flex-wrap gap-2">
                {CORE_WANT.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRediscover({ ...rediscover, coreWant: c.id })}
                    className={`px-3 py-2 rounded-full text-xs border ${
                      rediscover.coreWant === c.id
                        ? "bg-rose-500/25 border-amber-400/50 text-amber-50"
                        : "border-rose-500/20 text-rose-100/80"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-semibold text-sm"
              >
                Align paths with your forgotten spark
              </button>
            </form>
          )}

          {tab === "daily" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={fetchDaily}
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-semibold text-sm shadow-[0_0_24px_rgba(251,191,36,0.28)]"
              >
                Open today’s mini exploration
              </button>
              {daily && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-rose-950/50 to-stone-950 p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.25em] text-rose-200/50">
                    {String(daily.kind || "").replace(/_/g, " ")} · streak {daily.streak}
                  </p>
                  <h3 className="text-lg font-semibold text-rose-50 mt-2">{daily.title}</h3>
                  <p className="text-sm text-rose-100/85 mt-2 leading-relaxed">{daily.body}</p>
                  {daily.ctaPathId && (
                    <button
                      type="button"
                      onClick={() => openPath(daily.ctaPathId)}
                      className="mt-4 text-sm text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                    >
                      Open suggested path
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {tab === "capsules" && (
            <div className="space-y-3">
              {profile.capsules?.length ? (
                profile.capsules.map((cap) => (
                  <div
                    key={cap.capsuleId}
                    className="rounded-3xl border border-rose-500/15 bg-stone-950/70 p-4 flex justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-rose-200/50">
                        {cap.createdAt
                          ? new Date(cap.createdAt).toLocaleDateString()
                          : ""}
                      </p>
                      <h4 className="text-sm font-semibold text-rose-50">{cap.title}</h4>
                      {cap.note && (
                        <p className="text-sm text-rose-100/80 mt-1">{cap.note}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCapsule(cap.capsuleId)}
                      className="self-start text-rose-300/50 hover:text-rose-400"
                      aria-label="Delete capsule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-rose-200/70 text-sm leading-relaxed">
                  Future Capsules hold private saves from paths you explored. Open a path, then tap{" "}
                  <em>Save capsule</em>.
                </p>
              )}
            </div>
          )}

          {tab === "matches" && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-rose-500/15 bg-stone-950/55 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-200/45 mb-2">
                  Premium (when enabled)
                </p>
                <ul className="text-sm text-rose-100/85 space-y-2 list-disc pl-4 marker:text-amber-400/80">
                  <li>Unlimited simulations & deeper matching</li>
                  <li>Roadmap + skill plans toward a chosen direction</li>
                  <li>Income scenarios, voice prompts, coaching</li>
                </ul>
                <p className="text-[11px] text-rose-200/50 mt-3 leading-relaxed">
                  Core exploration works without premium; connect billing later to unlock extras.
                </p>
              </div>
              <h3 className="text-sm font-medium text-amber-200/90">Your top future matches</h3>
              {topMatches.length === 0 && (
                <p className="text-sm text-rose-200/70">
                  Finish onboarding and explore a path — matches appear here with reasons why they fit.
                </p>
              )}
              {topMatches.map((m, i) => (
                <div
                  key={m.pathId}
                  className="rounded-3xl border border-rose-500/10 bg-stone-900/45 p-4"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-rose-300/50 text-xs">#{i + 1}</span>
                    <span className="text-xs text-amber-300/85">
                      {Math.round((m.score || 0) * 100)}% fit
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-rose-50 mt-1">{m.title}</h4>
                  <p className="text-xs text-rose-100/80 mt-2 leading-relaxed">{m.why}</p>
                  <button
                    type="button"
                    onClick={() => openPath(m.pathId)}
                    className="mt-3 text-sm text-amber-300 hover:text-amber-100"
                  >
                    Explore this parallel →
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
