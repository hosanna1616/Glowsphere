import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import EchoesApi from "../../api/echoesApi";

const defaultSuitcaseForm = {
  vibeWords: "",
  styleTags: "",
  destinationDreams: "",
  energyNote: "",
  privacyMode: "reveal_on_mutual_yes",
};

const defaultItemForm = {
  type: "ootd",
  title: "",
  caption: "",
  mediaUrl: "",
  colorMood: "",
  tags: "",
};

const defaultLetterForm = {
  recipientType: "future_self",
  title: "",
  body: "",
  milestoneType: "days_since_joined",
  milestoneTarget: 30,
};

const defaultMemoryForm = {
  title: "",
  body: "",
  destinations: "",
};

const itemTypeLabels = {
  ootd: "OOTD",
  travel_photo: "Travel Photo",
  outfit_selfie: "Outfit Selfie",
  story: "Story",
};

const milestoneLabels = {
  days_since_joined: "Days since joined",
  quests_completed: "Quests completed",
  challenges_completed: "Challenges completed",
};

const splitTextList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatTimeLeft = (timeLeftMs) => {
  if (!timeLeftMs || timeLeftMs <= 0) {
    return "Closing now";
  }
  const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
};

const Echoes = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [suitcaseForm, setSuitcaseForm] = useState(defaultSuitcaseForm);
  const [itemForm, setItemForm] = useState(defaultItemForm);
  const [letterForm, setLetterForm] = useState(defaultLetterForm);
  const [voiceNoteText, setVoiceNoteText] = useState("");
  const [memoryForm, setMemoryForm] = useState(defaultMemoryForm);
  const [itemImageName, setItemImageName] = useState("");
  const [selectedTryOnId, setSelectedTryOnId] = useState("");
  const [activeTab, setActiveTab] = useState("suitcase");

  const loadOverview = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await EchoesApi.getOverview();
      setOverview(response);
      setSuitcaseForm({
        vibeWords: response.suitcase.vibeWords.join(", "),
        styleTags: response.suitcase.styleTags.join(", "),
        destinationDreams: response.suitcase.destinationDreams.join(", "),
        energyNote: response.suitcase.energyNote || "",
        privacyMode: response.suitcase.privacyMode || "reveal_on_mutual_yes",
      });
      if (response.currentMatch?.jointMemory) {
        setMemoryForm({
          title: response.currentMatch.jointMemory.title || "",
          body: response.currentMatch.jointMemory.body || "",
          destinations: (response.currentMatch.jointMemory.destinations || []).join(", "),
        });
      }
    } catch (error) {
      showToast(error.message || "Failed to load Echoes", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const tryOnItem = useMemo(() => {
    const allItems = [
      ...(overview?.suitcase?.items || []),
      ...(overview?.currentMatch?.soulSister?.items || []),
    ];
    return allItems.find((item) => item._id === selectedTryOnId) || null;
  }, [overview, selectedTryOnId]);

  const saveSuitcaseProfile = async (event) => {
    event.preventDefault();
    try {
      await EchoesApi.updateSuitcase({
        vibeWords: splitTextList(suitcaseForm.vibeWords),
        styleTags: splitTextList(suitcaseForm.styleTags),
        destinationDreams: splitTextList(suitcaseForm.destinationDreams),
        energyNote: suitcaseForm.energyNote,
        privacyMode: suitcaseForm.privacyMode,
      });
      showToast("Soul Suitcase updated", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to update Soul Suitcase", "error");
    }
  };

  const addSuitcaseItem = async (event) => {
    event.preventDefault();
    try {
      await EchoesApi.addSuitcaseItem({
        ...itemForm,
        tags: splitTextList(itemForm.tags),
      });
      setItemForm(defaultItemForm);
      setItemImageName("");
      showToast("Added to your Soul Suitcase", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to add suitcase item", "error");
    }
  };

  const handleItemImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "warning");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Image must be 8MB or less", "warning");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setItemForm((prev) => ({ ...prev, mediaUrl: reader.result || "" }));
      setItemImageName(file.name);
    };
    reader.onerror = () => {
      showToast("Failed to read image file", "error");
    };
    reader.readAsDataURL(file);
  };

  const deleteSuitcaseItem = async (itemId) => {
    try {
      await EchoesApi.deleteSuitcaseItem(itemId);
      showToast("Suitcase item deleted", "success");
      if (selectedTryOnId === itemId) {
        setSelectedTryOnId("");
      }
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to delete suitcase item", "error");
    }
  };

  const findSoulSister = async () => {
    try {
      await EchoesApi.findSoulSister();
      showToast("Your Soul Sister is here for 24 hours", "success");
      setActiveTab("match");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Could not find a Soul Sister", "error");
    }
  };

  const sendVoiceNote = async (event) => {
    event.preventDefault();
    if (!overview?.currentMatch?._id) {
      return;
    }
    try {
      await EchoesApi.addVoiceNote(overview.currentMatch._id, voiceNoteText);
      setVoiceNoteText("");
      showToast("Secret voice note sent", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to send voice note", "error");
    }
  };

  const deleteVoiceNote = async (noteId) => {
    if (!overview?.currentMatch?._id) {
      return;
    }
    try {
      await EchoesApi.deleteVoiceNote(overview.currentMatch._id, noteId);
      showToast("Voice note deleted", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to delete voice note", "error");
    }
  };

  const saveMemory = async (event) => {
    event.preventDefault();
    if (!overview?.currentMatch?._id) {
      return;
    }
    try {
      await EchoesApi.saveJointMemory(overview.currentMatch._id, {
        title: memoryForm.title,
        body: memoryForm.body,
        destinations: splitTextList(memoryForm.destinations),
      });
      showToast("What If We Traveled Together saved", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to save joint memory", "error");
    }
  };

  const chooseReveal = async (decision) => {
    if (!overview?.currentMatch?._id) {
      return;
    }
    try {
      await EchoesApi.updateRevealDecision(overview.currentMatch._id, decision);
      showToast(
        decision === "yes" ? "Reveal choice saved" : "You kept it anonymous",
        "success"
      );
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to save reveal decision", "error");
    }
  };

  const closeMatch = async () => {
    if (!overview?.currentMatch?._id) {
      return;
    }
    try {
      await EchoesApi.closeMatch(overview.currentMatch._id);
      showToast("Soul connection closed", "success");
      setSelectedTryOnId("");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to close soul match", "error");
    }
  };

  const createLetter = async (event) => {
    event.preventDefault();
    try {
      await EchoesApi.createLegacyLetter(letterForm);
      setLetterForm(defaultLetterForm);
      showToast("Legacy Letter saved privately", "success");
      setActiveTab("letters");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to save letter", "error");
    }
  };

  const deleteLetter = async (letterId) => {
    try {
      await EchoesApi.deleteLegacyLetter(letterId);
      showToast("Legacy Letter deleted", "success");
      loadOverview(true);
    } catch (error) {
      showToast(error.message || "Failed to delete letter", "error");
    }
  };

  if (loading && !overview) {
    return (
      <div className="py-8">
        <div className="text-amber-300 text-lg">Loading Echoes...</div>
      </div>
    );
  }

  const suitcase = overview?.suitcase;
  const currentMatch = overview?.currentMatch;
  const letters = overview?.legacyLetters || [];
  const progress = overview?.milestoneProgress || {};

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/feed")}
            className="text-amber-300 hover:text-amber-200 text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-amber-300">Echoes</h1>
            <p className="text-amber-200/80">
              Soul Suitcase, anonymous matching, and Legacy Letters.
            </p>
          </div>
        </div>
        <button
          onClick={() => loadOverview(true)}
          className="px-4 py-2 rounded-full border border-amber-500/30 text-amber-200 hover:bg-stone-800"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(overview?.privacyNotices || []).map((notice) => (
          <div
            key={notice}
            className="bg-card-bg border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-100"
          >
            {notice}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {["suitcase", "match", "letters"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${
              activeTab === tab
                ? "bg-gold-gradient text-black font-semibold"
                : "bg-card-bg border border-amber-500/30 text-amber-200"
            }`}
          >
            {tab === "suitcase"
              ? "Soul Suitcase"
              : tab === "match"
                ? "Find My Soul Sister"
                : "Legacy Letters"}
          </button>
        ))}
      </div>

      {activeTab === "suitcase" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form
              onSubmit={saveSuitcaseProfile}
              className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold text-amber-300">Your glowing Soul Suitcase</h2>
                <p className="text-sm text-amber-200/80">
                  Set your style energy before the weekly anonymous match.
                </p>
              </div>
              <input
                value={suitcaseForm.vibeWords}
                onChange={(event) =>
                  setSuitcaseForm((prev) => ({ ...prev, vibeWords: event.target.value }))
                }
                placeholder="Vibe words: dreamy, bold, soft"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <input
                value={suitcaseForm.styleTags}
                onChange={(event) =>
                  setSuitcaseForm((prev) => ({ ...prev, styleTags: event.target.value }))
                }
                placeholder="Style tags: vintage, streetwear, coastal"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <input
                value={suitcaseForm.destinationDreams}
                onChange={(event) =>
                  setSuitcaseForm((prev) => ({
                    ...prev,
                    destinationDreams: event.target.value,
                  }))
                }
                placeholder="Dream trips: Seoul, Paris, Zanzibar"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <textarea
                value={suitcaseForm.energyNote}
                onChange={(event) =>
                  setSuitcaseForm((prev) => ({ ...prev, energyNote: event.target.value }))
                }
                placeholder="Your energy in one small note"
                rows="4"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <select
                value={suitcaseForm.privacyMode}
                onChange={(event) =>
                  setSuitcaseForm((prev) => ({ ...prev, privacyMode: event.target.value }))
                }
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              >
                <option value="reveal_on_mutual_yes">Reveal only if both choose yes</option>
                <option value="anonymous">Stay anonymous by default</option>
              </select>
              <button
                type="submit"
                className="bg-gold-gradient px-5 py-3 rounded-full font-semibold text-black"
              >
                Save Soul Suitcase
              </button>
            </form>

            <form
              onSubmit={addSuitcaseItem}
              className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold text-amber-300">Pack your memories</h2>
                <p className="text-sm text-amber-200/80">
                  Add OOTDs, travel photos, selfies, and story fragments.
                </p>
              </div>
              <select
                value={itemForm.type}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, type: event.target.value }))
                }
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              >
                {Object.entries(itemTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                value={itemForm.title}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Title"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleItemImageUpload}
                  className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100 file:mr-4 file:rounded-full file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-black file:font-semibold"
                />
                {itemImageName && (
                  <div className="text-xs text-amber-300">
                    Selected image: {itemImageName}
                  </div>
                )}
                {itemForm.mediaUrl && (
                  <img
                    src={itemForm.mediaUrl}
                    alt="Upload preview"
                    className="w-full h-44 object-cover rounded-xl border border-amber-500/20"
                  />
                )}
              </div>
              <input
                value={itemForm.colorMood}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, colorMood: event.target.value }))
                }
                placeholder="Color mood"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <input
                value={itemForm.tags}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                placeholder="Tags: linen, gold, summer"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <textarea
                value={itemForm.caption}
                onChange={(event) =>
                  setItemForm((prev) => ({ ...prev, caption: event.target.value }))
                }
                placeholder="Caption or story"
                rows="4"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <button
                type="submit"
                className="bg-gold-gradient px-5 py-3 rounded-full font-semibold text-black"
              >
                Pack Item
              </button>
            </form>
          </div>

          <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-amber-300">Packed inside</h2>
                <p className="text-sm text-amber-200/80">
                  {suitcase?.items?.length || 0} private items ready for matching.
                </p>
              </div>
              <div className="text-sm text-amber-300">
                {suitcase?.matcher?.canFindMatch
                  ? "Weekly match available"
                  : `Next match after ${new Date(
                      suitcase?.matcher?.cooldownEndsAt
                    ).toLocaleString()}`}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(suitcase?.items || []).map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-amber-500/20 bg-stone-950 overflow-hidden"
                >
                  {item.mediaUrl ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-500/20 to-pink-500/20 flex items-center justify-center text-amber-200">
                      {itemTypeLabels[item.type]}
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-amber-100">{item.title}</h3>
                      <span className="text-xs text-amber-300">{itemTypeLabels[item.type]}</span>
                    </div>
                    <p className="text-sm text-amber-200/80">{item.caption}</p>
                    <div className="flex flex-wrap gap-2">
                      {(item.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setSelectedTryOnId(item._id)}
                        className="text-sm text-amber-300 hover:text-amber-100"
                      >
                        Try in AR preview
                      </button>
                      <button
                        onClick={() => deleteSuitcaseItem(item._id)}
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "match" && (
        <div className="space-y-6">
          <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-300">Find My Soul Sister</h2>
              <p className="text-amber-200/80 max-w-2xl">
                Once a week you get one anonymous 24-hour match with a girl whose style and
                energy overlaps with yours.
              </p>
            </div>
            <button
              onClick={findSoulSister}
              disabled={!suitcase?.matcher?.canFindMatch || Boolean(currentMatch)}
              className="bg-gold-gradient px-6 py-3 rounded-full font-semibold text-black disabled:opacity-50"
            >
              {currentMatch
                ? "Soul Sister active"
                : suitcase?.matcher?.canFindMatch
                  ? "Find My Soul Sister"
                  : "Weekly cooldown"}
            </button>
          </div>

          {currentMatch ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-amber-300">
                        {currentMatch.soulSister.name || currentMatch.soulSister.alias}
                      </h3>
                      <p className="text-sm text-amber-200/80">
                        {formatTimeLeft(currentMatch.timeLeftMs)}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-300">
                      {currentMatch.status === "revealed" ? "Revealed" : "Anonymous"}
                    </span>
                  </div>
                  <p className="text-sm text-amber-100">{currentMatch.privacyNotice}</p>
                  <div className="flex flex-wrap gap-2">
                    {(currentMatch.sharedSignals || []).map((signal) => (
                      <span
                        key={signal}
                        className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-200 text-sm"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-stone-950 p-4">
                      <h4 className="font-semibold text-amber-200 mb-2">Style</h4>
                      <div className="flex flex-wrap gap-2">
                        {(currentMatch.soulSister.styleTags || []).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-stone-950 p-4">
                      <h4 className="font-semibold text-amber-200 mb-2">Energy</h4>
                      <p className="text-sm text-amber-100">{currentMatch.soulSister.energyNote}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => chooseReveal("yes")}
                      className="px-4 py-2 rounded-full bg-gold-gradient text-black font-semibold"
                    >
                      Choose Reveal
                    </button>
                    <button
                      onClick={() => chooseReveal("no")}
                      className="px-4 py-2 rounded-full border border-amber-500/30 text-amber-200"
                    >
                      Stay Anonymous
                    </button>
                    <button
                      onClick={closeMatch}
                      className="px-4 py-2 rounded-full border border-red-500/30 text-red-300"
                    >
                      Close Forever
                    </button>
                  </div>
                  <div className="text-sm text-amber-200/80">
                    Reveal status: you chose <strong>{currentMatch.reveal.mine}</strong>, she chose{" "}
                    <strong>{currentMatch.reveal.theirs}</strong>.
                  </div>
                </div>

                <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-amber-300">Virtual try-on AR preview</h3>
                  <p className="text-sm text-amber-200/80">
                    Pick any item from either suitcase to preview it in a simple mirror mode MVP.
                  </p>
                  <select
                    value={selectedTryOnId}
                    onChange={(event) => setSelectedTryOnId(event.target.value)}
                    className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                  >
                    <option value="">Select an outfit or memory item</option>
                    {[...(suitcase?.items || []), ...(currentMatch.soulSister.items || [])].map(
                      (item) => (
                        <option key={item._id} value={item._id}>
                          {item.title}
                        </option>
                      )
                    )}
                  </select>
                  <div className="rounded-[2rem] bg-gradient-to-b from-stone-900 to-black border border-amber-500/20 p-6 min-h-[360px] flex flex-col items-center justify-center text-center">
                    <div className="w-40 h-56 rounded-[999px] border border-amber-500/30 bg-stone-950/70 flex items-center justify-center mb-4 overflow-hidden">
                      {tryOnItem?.mediaUrl ? (
                        <img
                          src={tryOnItem.mediaUrl}
                          alt={tryOnItem.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="text-amber-300">AR Mirror</div>
                      )}
                    </div>
                    <div className="text-amber-100 font-semibold">
                      {tryOnItem ? tryOnItem.title : "Choose a look to preview"}
                    </div>
                    <div className="text-sm text-amber-200/70 max-w-md mt-2">
                      {tryOnItem
                        ? tryOnItem.caption || "Previewing this mood in your shared mirror."
                        : "This MVP preview lets both girls compare style mood and pieces before the 24-hour window closes."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-amber-300">Secret voice notes</h3>
                  <form onSubmit={sendVoiceNote} className="space-y-3">
                    <textarea
                      value={voiceNoteText}
                      onChange={(event) => setVoiceNoteText(event.target.value)}
                      placeholder="Leave a soft secret note..."
                      rows="3"
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                    />
                    <button
                      type="submit"
                      className="bg-gold-gradient px-5 py-3 rounded-full font-semibold text-black"
                    >
                      Send Note
                    </button>
                  </form>
                  <div className="space-y-3">
                    {(currentMatch.voiceNotes || []).map((note) => (
                      <div
                        key={note._id}
                        className="rounded-2xl bg-stone-950 border border-amber-500/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm text-amber-300">{note.alias}</div>
                          {note.isMine && (
                            <button
                              onClick={() => deleteVoiceNote(note._id)}
                              className="text-xs text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div className="text-amber-100 mt-2">{note.text}</div>
                      </div>
                    ))}
                    {currentMatch.voiceNotes.length === 0 && (
                      <div className="text-sm text-amber-200/70">
                        No secret notes yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-amber-300">
                    What If We Traveled Together
                  </h3>
                  <form onSubmit={saveMemory} className="space-y-3">
                    <input
                      value={memoryForm.title}
                      onChange={(event) =>
                        setMemoryForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Memory title"
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                    />
                    <input
                      value={memoryForm.destinations}
                      onChange={(event) =>
                        setMemoryForm((prev) => ({
                          ...prev,
                          destinations: event.target.value,
                        }))
                      }
                      placeholder="Destinations: Kyoto, Tulum"
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                    />
                    <textarea
                      value={memoryForm.body}
                      onChange={(event) =>
                        setMemoryForm((prev) => ({ ...prev, body: event.target.value }))
                      }
                      placeholder="Describe the trip that almost existed"
                      rows="5"
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                    />
                    <button
                      type="submit"
                      className="bg-gold-gradient px-5 py-3 rounded-full font-semibold text-black"
                    >
                      Save Joint Memory
                    </button>
                  </form>
                </div>
              </div>

              <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-amber-300 mb-4">
                  Her Soul Suitcase
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(currentMatch.soulSister.items || []).map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-amber-500/20 bg-stone-950 overflow-hidden"
                    >
                      {item.mediaUrl ? (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-amber-500/20 flex items-center justify-center text-amber-200">
                          {itemTypeLabels[item.type]}
                        </div>
                      )}
                      <div className="p-4">
                        <div className="font-semibold text-amber-100">{item.title}</div>
                        <div className="text-sm text-amber-200/80 mt-2">{item.caption}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-8 text-center text-amber-200">
              No active soul match yet. Fill your suitcase, then use your weekly match.
            </div>
          )}
        </div>
      )}

      {activeTab === "letters" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form
              onSubmit={createLetter}
              className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold text-amber-300">Legacy Letters</h2>
                <p className="text-sm text-amber-200/80">
                  Write privately to your future self or future daughter. Letters unlock on
                  growth milestones.
                </p>
              </div>
              <select
                value={letterForm.recipientType}
                onChange={(event) =>
                  setLetterForm((prev) => ({
                    ...prev,
                    recipientType: event.target.value,
                  }))
                }
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              >
                <option value="future_self">Future self</option>
                <option value="future_daughter">Future daughter</option>
              </select>
              <input
                value={letterForm.title}
                onChange={(event) =>
                  setLetterForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Letter title"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <textarea
                value={letterForm.body}
                onChange={(event) =>
                  setLetterForm((prev) => ({ ...prev, body: event.target.value }))
                }
                placeholder="Write something she will need one day..."
                rows="7"
                className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={letterForm.milestoneType}
                  onChange={(event) =>
                    setLetterForm((prev) => ({
                      ...prev,
                      milestoneType: event.target.value,
                    }))
                  }
                  className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                >
                  {Object.entries(milestoneLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={letterForm.milestoneTarget}
                  onChange={(event) =>
                    setLetterForm((prev) => ({
                      ...prev,
                      milestoneTarget: Number(event.target.value),
                    }))
                  }
                  className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-100"
                />
              </div>
              <button
                type="submit"
                className="bg-gold-gradient px-5 py-3 rounded-full font-semibold text-black"
              >
                Save Letter
              </button>
            </form>

            <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6 space-y-4">
              <h2 className="text-2xl font-bold text-amber-300">Growth milestones</h2>
              <div className="space-y-3">
                {Object.entries(milestoneLabels).map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-2xl bg-stone-950 border border-amber-500/20 p-4 flex items-center justify-between"
                  >
                    <span className="text-amber-100">{label}</span>
                    <span className="text-amber-300 font-semibold">{progress[key] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card-bg border border-amber-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">Your private letters</h2>
            <div className="space-y-4">
              {letters.map((letter) => (
                <div
                  key={letter._id}
                  className="rounded-2xl border border-amber-500/20 bg-stone-950 p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-amber-100">{letter.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            letter.isUnlocked
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {letter.isUnlocked ? "Unlocked" : "Locked"}
                        </span>
                      </div>
                      <div className="text-sm text-amber-200/80">
                        To {letter.recipientType === "future_self" ? "future self" : "future daughter"}
                      </div>
                      <div className="text-sm text-amber-200/80">
                        Unlocks at {letter.milestoneTarget} {milestoneLabels[letter.milestoneType]}.
                        Current progress: {letter.progressValue}
                      </div>
                      <p className="text-amber-100 whitespace-pre-wrap">
                        {letter.isUnlocked
                          ? letter.body
                          : "This letter is sealed until your growth milestone is reached."}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteLetter(letter._id)}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {letters.length === 0 && (
                <div className="text-amber-200/70">No letters yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Echoes;
