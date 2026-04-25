import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import CampfireApi from "../../api/campfireApi";
import UserApi from "../../api/userApi";
import { getCampfireSocket, joinCampfireRoomSocket } from "../../api/campfireSocket";
import { FIRE_SPIRITS, FIRE_SPIRIT_BY_NAME } from "./fireSpirits";

const GAME_MODES = [
  { key: "finish-ember", title: "Finish the Ember", prompt: "The one where our night got brighter because..." },
  { key: "never-ever", title: "Never Have I Ever", prompt: "Confession round with glowing ember drops." },
  { key: "truth-lie", title: "Two Truths and a Lie", prompt: "Say 3 things. Everyone guesses the lie." },
  { key: "wyr", title: "Would You Rather", prompt: "Quick campfire choices and voice answers." },
  { key: "story-weaver", title: "Story Weaver", prompt: "One line each. Wild Ember twists included." },
];

const formatMessage = (msg) => ({
  id: msg._id || msg.id || `${Date.now()}-${Math.random()}`,
  username: msg.username || "unknown",
  text: msg.text || "",
  isVoice: !!msg.isVoice,
  voiceUrl: msg.voiceUrl || "",
  duration: msg.duration || 0,
  timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
});

const EnhancedCampfire = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [inviteUsername, setInviteUsername] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedSpiritName, setSelectedSpiritName] = useState(
    user?.fireSpirits?.[0]?.spiritName || FIRE_SPIRITS[0].spiritName,
  );
  const [selectedMode, setSelectedMode] = useState(GAME_MODES[0].key);
  const [gameResponses, setGameResponses] = useState([]);
  const [gameInput, setGameInput] = useState("");
  const [gameVotes, setGameVotes] = useState({});
  const [winnerUsername, setWinnerUsername] = useState("");
  const [recording, setRecording] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const roomId = activeRoom?._id || activeRoom?.id;
  const myUsername = user?.username || "you";
  const selectedSpirit = FIRE_SPIRIT_BY_NAME[selectedSpiritName] || FIRE_SPIRITS[0];
  const mode = GAME_MODES.find((m) => m.key === selectedMode) || GAME_MODES[0];

  const loadRooms = async () => {
    try {
      const roomData = await CampfireApi.getRooms();
      setRooms((roomData || []).map((room) => ({ ...room, id: room._id || room.id, _id: room._id || room.id })));
    } catch (error) {
      showToast(error.message || "Failed to load rooms", "error");
    }
  };

  const loadFriends = async () => {
    try {
      const data = await UserApi.getFriends();
      setFriends(data || []);
    } catch (error) {
      setFriends([]);
    }
  };

  useEffect(() => {
    loadRooms();
    loadFriends();
    const timer = setInterval(loadRooms, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    const wireSocket = () => {
      const socket = joinCampfireRoomSocket(roomId);
      socketRef.current = socket;
      const onText = (payload) => setMessages((prev) => [...prev, formatMessage(payload)]);
      const onVoice = (payload) => setMessages((prev) => [...prev, formatMessage(payload)]);
      const onGame = (payload) => {
        setSelectedMode(payload.modeKey || GAME_MODES[0].key);
        setGameResponses(payload.responses || []);
        setGameVotes(payload.votes || {});
        setWinnerUsername(payload.winnerUsername || "");
      };
      const onDeleted = (payload) => {
        if (!payload?.messageId) {
          return;
        }
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.messageId));
      };
      socket.on("receive_message", onText);
      socket.on("receive_voice_message", onVoice);
      socket.on("campfire_game_sync", onGame);
      socket.on("campfire_message_deleted", onDeleted);
      return () => {
        socket.off("receive_message", onText);
        socket.off("receive_voice_message", onVoice);
        socket.off("campfire_game_sync", onGame);
        socket.off("campfire_message_deleted", onDeleted);
      };
    };
    const cleanup = wireSocket();
    return cleanup;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    const loadMessages = async () => {
      try {
        const data = await CampfireApi.getMessages(roomId);
        setMessages((data || []).map(formatMessage));
      } catch (error) {
        showToast(error.message || "Unable to load messages", "error");
      }
    };
    loadMessages();
  }, [roomId]);

  const persistSpirit = async (spirit) => {
    const payload = [spirit, ...(user?.fireSpirits || []).filter((x) => x.spiritName !== spirit.spiritName)].slice(0, 6);
    const updated = await UserApi.updateProfile({ fireSpirits: payload });
    setUser(updated);
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      return;
    }
    try {
      const room = await CampfireApi.createRoom({ name: newRoomName.trim(), maxParticipants: 12 });
      setNewRoomName("");
      await loadRooms();
      await joinRoom(room);
    } catch (error) {
      showToast(error.message || "Unable to create room", "error");
    }
  };

  const joinRoom = async (room) => {
    try {
      const updated = await CampfireApi.joinRoom(room._id || room.id);
      setActiveRoom({ ...updated, id: updated._id || updated.id });
    } catch (error) {
      showToast(error.message || "Unable to join room", "error");
    }
  };

  const leaveRoom = async () => {
    if (!roomId) {
      setActiveRoom(null);
      return;
    }
    await CampfireApi.leaveRoom(roomId);
    setActiveRoom(null);
    setMessages([]);
  };

  const sendText = async () => {
    if (!newMessage.trim() || !roomId) {
      return;
    }
    try {
      const saved = await CampfireApi.sendTextMessage(roomId, newMessage.trim());
      const payload = formatMessage(saved);
      setMessages((prev) => [...prev, payload]);
      socketRef.current?.emit("send_message", { ...payload, roomId });
      setNewMessage("");
    } catch (error) {
      showToast(error.message || "Failed to send message", "error");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (!blob.size || !roomId) {
          return;
        }
        try {
          const saved = await CampfireApi.sendVoiceMessage(roomId, { audioBlob: blob, duration: 4 });
          const payload = formatMessage(saved);
          setMessages((prev) => [...prev, payload]);
          socketRef.current?.emit("send_voice_message", { ...payload, roomId });
        } catch (error) {
          showToast(error.message || "Voice message failed", "error");
        }
      };
      recorder.start();
      setRecording(true);
    } catch (error) {
      showToast("Microphone permission is required.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const syncGame = (next) => {
    socketRef.current?.emit("campfire_game_sync", { ...next, roomId });
  };

  const submitGameResponse = async () => {
    if (!gameInput.trim()) {
      return;
    }
    const response = {
      id: `${Date.now()}-${Math.random()}`,
      username: myUsername,
      text: gameInput.trim(),
    };
    const nextResponses = [...gameResponses, response];
    setGameResponses(nextResponses);
    syncGame({ modeKey: selectedMode, responses: nextResponses, votes: gameVotes, winnerUsername });
    setGameInput("");
  };

  const voteGame = (responseId, emoji) => {
    const nextVotes = { ...gameVotes };
    if (!nextVotes[responseId]) {
      nextVotes[responseId] = [];
    }
    nextVotes[responseId].push({ username: myUsername, emoji });
    setGameVotes(nextVotes);
    syncGame({ modeKey: selectedMode, responses: gameResponses, votes: nextVotes, winnerUsername });
  };

  const awardWinner = async () => {
    if (!gameResponses.length) {
      return;
    }
    const ranking = [...gameResponses]
      .map((response) => ({ ...response, score: (gameVotes[response.id] || []).length }))
      .sort((a, b) => b.score - a.score);
    const winner = ranking[0];
    setWinnerUsername(winner.username);
    syncGame({ modeKey: selectedMode, responses: gameResponses, votes: gameVotes, winnerUsername: winner.username });
    const currentPoints = Number(user?.glowPoints || 0);
    const gained = winner.username === myUsername ? 65 : 15;
    const crownUntil =
      winner.username === myUsername ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : user?.emberCrownUntil;
    const bloomGarden = [...(user?.bloomGarden || [])];
    if (winner.username === myUsername && !bloomGarden.includes("Rare Glowing Fire Flower")) {
      bloomGarden.push("Rare Glowing Fire Flower");
    }
    const updated = await UserApi.updateProfile({
      glowPoints: currentPoints + gained,
      bloomGarden,
      emberCrownUntil: crownUntil,
    });
    setUser(updated);
    showToast(winner.username === myUsername ? "Winner rewards applied." : `@${winner.username} won this round!`, "success");
  };

  const addFriend = async () => {
    if (!friendUsername.trim()) {
      return;
    }
    try {
      await UserApi.addFriend(friendUsername.trim());
      setFriendUsername("");
      await loadFriends();
      showToast("Friend added", "success");
    } catch (error) {
      showToast(error.message || "Unable to add friend", "error");
    }
  };

  const inviteUser = async (username) => {
    if (!username.trim() || !roomId) {
      return;
    }
    try {
      await CampfireApi.inviteFriend(roomId, username.trim());
      const refreshed = await CampfireApi.getRoom(roomId);
      setActiveRoom({ ...refreshed, id: refreshed._id || refreshed.id });
      setInviteUsername("");
      showToast(`Invited @${username}`, "success");
    } catch (error) {
      showToast(error.message || "Invite failed", "error");
    }
  };

  const participants = useMemo(() => activeRoom?.participants || [], [activeRoom]);

  const deleteMessageWithScope = async (message, deleteType) => {
    if (!roomId || !message?.id) {
      return;
    }
    try {
      await CampfireApi.deleteMessage(roomId, message.id, deleteType);
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      if (deleteType === "everyone") {
        socketRef.current?.emit("campfire_message_deleted", {
          roomId,
          messageId: message.id,
          deleteType,
          deletedBy: myUsername,
        });
      }
      setDeleteTarget(null);
      showToast(
        deleteType === "everyone"
          ? "Message deleted for everyone"
          : "Message deleted for you",
        "success"
      );
    } catch (error) {
      showToast(error.message || "Failed to delete message", "error");
    }
  };

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate("/feed")} className="text-xl text-amber-300">←</button>
            <h1 className="text-3xl font-bold text-amber-300">
              GlowSphere Campfire
            </h1>
            <div />
          </div>
          <div className="bg-card-bg rounded-2xl border border-amber-500/30 p-4 mb-6 flex gap-2">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Create a campfire room"
              className="flex-1 rounded-lg bg-stone-800 border border-amber-500/30 px-3 py-2 text-amber-100"
            />
            <button onClick={createRoom} className="px-4 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">
              Create
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.id} className="bg-card-bg rounded-2xl border border-amber-500/30 p-4">
                <h3 className="text-amber-200 text-lg font-semibold">{room.name}</h3>
                <p className="text-amber-300 text-sm mb-4">{room.participants?.length || 0}/12 joined</p>
                <button onClick={() => joinRoom(room)} className="px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-100 p-4">
      <div className="max-w-7xl mx-auto grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="bg-card-bg rounded-2xl border border-amber-500/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={leaveRoom} className="text-xl text-amber-300">←</button>
            <h2 className="text-xl text-amber-200 font-semibold">{activeRoom.name}</h2>
            <span className="text-xs text-amber-300">{participants.length} members</span>
          </div>

          <div className="flex gap-2 mb-3">
            <select
              value={selectedSpiritName}
              onChange={(e) => setSelectedSpiritName(e.target.value)}
              className="flex-1 rounded-lg bg-stone-800 border border-amber-500/30 px-2 py-2"
            >
              {FIRE_SPIRITS.map((spirit) => (
                <option key={spirit.spiritName} value={spirit.spiritName}>
                  {spirit.spiritName}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                await persistSpirit(selectedSpirit);
                showToast("Fire Spirit saved", "success");
              }}
              className="px-3 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
            >
              Save
            </button>
          </div>

          <div className="relative h-72 rounded-xl bg-gradient-to-b from-black/30 to-amber-900/20 border border-amber-300/20">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">
              🔥
            </motion.div>
            {participants.map((participant, index) => {
              const angle = (index / Math.max(participants.length, 1)) * Math.PI * 2;
              const x = Math.cos(angle) * 120;
              const y = Math.sin(angle) * 95;
              const spirit = FIRE_SPIRIT_BY_NAME[participant.fireSpiritName] || selectedSpirit;
              return (
                <div key={participant.userId || index} className="absolute text-center" style={{ left: "50%", top: "50%", transform: `translate(${x}px, ${y}px)` }}>
                  <img
                    src={participant.fireSpiritActorImage || spirit.actorImage}
                    alt={spirit.actorName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = spirit.fallbackImage || "/glowsphere-logo.svg";
                    }}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.7)] mx-auto"
                  />
                  <p className="text-[11px] mt-1">{participant.fireSpiritName || spirit.spiritName}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <input
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Invite username"
              className="rounded-lg bg-stone-800 border border-amber-500/30 px-2 py-2 text-sm"
            />
            <button onClick={() => inviteUser(inviteUsername)} className="rounded-lg bg-gold-gradient text-black text-sm font-semibold hover:opacity-90">
              Invite User
            </button>
            <input
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Add friend username"
              className="rounded-lg bg-stone-800 border border-amber-500/30 px-2 py-2 text-sm"
            />
            <button onClick={addFriend} className="rounded-lg bg-gold-gradient text-black text-sm font-semibold hover:opacity-90">
              Add Friend
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {friends.slice(0, 10).map((friend) => (
              <button
                key={friend._id}
                onClick={() => inviteUser(friend.username)}
                className="px-2 py-1 rounded-full text-xs bg-stone-800 border border-amber-500/30 hover:border-amber-300/60"
              >
                @{friend.username}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card-bg rounded-2xl border border-amber-500/30 p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            {GAME_MODES.map((game) => (
              <button
                key={game.key}
                onClick={() => setSelectedMode(game.key)}
                className={`rounded-lg px-2 py-2 text-xs ${selectedMode === game.key ? "bg-amber-300/20 border border-amber-300/60" : "bg-stone-800 border border-amber-500/30"}`}
              >
                {game.title}
              </button>
            ))}
          </div>
          <p className="text-sm text-amber-100 mb-1.5">{mode.prompt}</p>
          <div className="flex gap-2 mb-2">
            <input
              value={gameInput}
              onChange={(e) => setGameInput(e.target.value)}
              placeholder="Game response"
              className="flex-1 rounded-lg bg-stone-800 border border-amber-500/30 px-3 py-2 text-sm"
            />
            <button onClick={submitGameResponse} className="px-3 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">Send</button>
            <button onClick={awardWinner} className="px-3 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">Award</button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 mb-2">
            {gameResponses.map((response) => (
              <div key={response.id} className="rounded-lg bg-stone-800/70 p-2">
                <div className="text-xs text-amber-200">@{response.username}</div>
                <p className="text-sm">{response.text}</p>
                <div className="flex gap-1 mt-1">
                  {["🔥", "💜", "✨", "👑"].map((emoji) => (
                    <button key={`${response.id}-${emoji}`} onClick={() => voteGame(response.id, emoji)} className="text-xs px-2 py-1 rounded-full bg-black border border-amber-500/30">
                      {emoji}
                    </button>
                  ))}
                  <span className="ml-auto text-xs">{(gameVotes[response.id] || []).length} votes</span>
                </div>
              </div>
            ))}
          </div>
          {winnerUsername ? <p className="text-sm text-amber-200 mb-1">Winner: @{winnerUsername}</p> : null}

          <div className="h-72 overflow-y-auto rounded-lg border border-amber-500/30 p-3 space-y-2 mb-2 bg-black/25">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-lg bg-stone-800/70 px-3 py-2">
                <div className="text-xs text-amber-200 flex items-center justify-between">
                  <span>@{msg.username}</span>
                  <button
                    onClick={() => setDeleteTarget(msg)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-100 hover:border-amber-300/70"
                  >
                    Delete
                  </button>
                </div>
                {msg.isVoice && msg.voiceUrl ? (
                  <audio controls src={msg.voiceUrl} className="w-full mt-1" />
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendText();
                }
              }}
              placeholder="Message everyone in this campfire..."
              className="flex-1 rounded-lg bg-stone-800 border border-amber-500/30 px-3 py-2 text-sm"
            />
            <button onClick={sendText} className="px-3 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">Send</button>
            {!recording ? (
              <button onClick={startRecording} className="px-3 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90">Voice</button>
            ) : (
              <button onClick={stopRecording} className="px-3 rounded-lg bg-red-500 text-white font-semibold">Stop</button>
            )}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-stone-950 p-5">
            <h3 className="text-lg font-semibold text-amber-200 mb-1">Delete message?</h3>
            <p className="text-sm text-amber-200 mb-4">
              Choose how you want this message to be deleted.
            </p>
            <div className="grid gap-2">
              <button
                onClick={() => deleteMessageWithScope(deleteTarget, "me")}
                className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-amber-500/30"
              >
                Delete for me
              </button>
              <button
                onClick={() => deleteMessageWithScope(deleteTarget, "everyone")}
                className="w-full px-4 py-2 rounded-lg bg-red-600/80 border border-red-300/40"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full px-4 py-2 rounded-lg border border-amber-500/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCampfire;

