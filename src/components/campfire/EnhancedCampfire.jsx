import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import CampfireApi from "../../api/campfireApi";

const EnhancedCampfire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [newRoom, setNewRoom] = useState({
    name: "",
    maxParticipants: 12,
    isPrivate: false,
  });

  // Messaging states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState([]);
  const [playingVoiceMessage, setPlayingVoiceMessage] = useState(null);
  const [voiceMessageProgress, setVoiceMessageProgress] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [recordingUsers, setRecordingUsers] = useState([]);
  const [speakingUsers, setSpeakingUsers] = useState([]);

  const recordingIntervalRef = useRef(null);
  const waveformIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Load rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomData = await CampfireApi.getRooms();
        // Normalize rooms to have both _id and id
        const normalizedRooms = (roomData || []).map((room) => ({
          ...room,
          _id: room._id || room.id,
          id: room._id || room.id,
        }));
        setRooms(normalizedRooms);
      } catch (error) {
        console.error("Failed to load rooms:", error);
        // Mock data for offline
        setRooms([
          {
            id: 1,
            _id: 1,
            name: "Late Night Chats",
            participants: [
              { userId: "1", username: "Sofia", avatar: "S", isSpeaking: false },
              { userId: "2", username: "Emma", avatar: "E", isSpeaking: true },
            ],
            isLive: true,
            isPrivate: false,
          },
          {
            id: 2,
            _id: 2,
            name: "Study Group",
            participants: [
              { userId: "3", username: "Maya", avatar: "M", isSpeaking: false },
            ],
            isLive: false,
            isPrivate: false,
          },
        ]);
      }
    };

    loadRooms();
    const roomRefreshInterval = setInterval(loadRooms, 10000);
    return () => clearInterval(roomRefreshInterval);
  }, []);

  // Load messages and subscribe to updates when active room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (activeRoom) {
        try {
          const roomId = activeRoom._id || activeRoom.id;
          if (!roomId) {
            console.error("Room ID is missing");
            return;
          }
          const messageData = await CampfireApi.getMessages(roomId);
          // Format messages to ensure consistent structure
          const formattedMessages = (messageData || []).map((msg) => ({
            id: msg._id || msg.id,
            text: msg.text || "",
            username: msg.username || "Unknown",
            timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
            isVoice: msg.isVoice || false,
            voiceUrl: msg.voiceUrl || msg.audioUrl || "",
            duration: msg.duration || 0,
            played: false,
          }));
          setMessages(formattedMessages);

          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }

          unsubscribeRef.current = CampfireApi.subscribeToRoom(
            roomId,
            (updatedMessages) => {
              const formatted = (updatedMessages || []).map((msg) => ({
                id: msg._id || msg.id,
                text: msg.text || "",
                username: msg.username || "Unknown",
                timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
                isVoice: msg.isVoice || false,
                voiceUrl: msg.voiceUrl || msg.audioUrl || "",
                duration: msg.duration || 0,
                played: false,
              }));
              setMessages(formatted);
            }
          );
        } catch (error) {
          console.error("Failed to load messages:", error);
          showToast("Failed to load messages", "error");
          setMessages([]);
        }
      } else {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setMessages([]);
      }
    };

    loadMessages();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [activeRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-play voice messages in chronological order when scrolled to them
  const handleVoiceMessageInView = useCallback((message) => {
    if (message.isVoice && !message.played && !playingVoiceMessage) {
      playVoiceMessage(message);
    }
  }, [playingVoiceMessage]);

  // Generate waveform animation
  const generateWaveform = () => {
    const bars = Array.from({ length: 20 }, () =>
      Math.random() * 60 + 20
    );
    setRecordingWaveform(bars);
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        // Send voice message
        if (activeRoom && audioBlob.size > 0) {
          try {
            const duration = recordingTime;
            const roomId = activeRoom._id || activeRoom.id;
            if (!roomId) {
              throw new Error("Room ID is missing. Please rejoin the room.");
            }
            const result = await CampfireApi.sendVoiceMessage(roomId, {
              audioBlob,
              duration,
            });
            
            // Use the voiceUrl from backend response, or create local URL as fallback
            const voiceUrl = result.voiceUrl || URL.createObjectURL(audioBlob);
            
            // Add message to local state immediately
            const voiceMessage = {
              id: result._id || result.id || Date.now(),
              _id: result._id || result.id || Date.now(),
              text: `Voice message (${duration}s)`,
              username: result.username || user?.username || "You",
              timestamp: result.timestamp || result.createdAt || new Date().toISOString(),
              isVoice: true,
              voiceUrl: voiceUrl,
              duration: duration,
              played: false,
            };
            setMessages((prev) => [...prev, voiceMessage]);
            showToast("Voice message sent!", "success");
          } catch (error) {
            console.error("Failed to send voice message:", error);
            const errorMessage = error.message || "Failed to send voice message";
            if (errorMessage.includes("video")) {
              showToast("Failed to send voice message. Please try again.", "error");
            } else {
              showToast(errorMessage, "error");
            }
          }
        } else {
          showToast("No audio recorded", "warning");
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingUsers(["You"]);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start waveform animation
      waveformIntervalRef.current = setInterval(generateWaveform, 100);
    } catch (error) {
      console.error("Failed to start recording:", error);
      showToast("Microphone access denied. Please enable microphone permissions.", "error");
    }
  };

  const stopRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingUsers([]);
      clearInterval(recordingIntervalRef.current);
      clearInterval(waveformIntervalRef.current);
      setRecordingTime(0);
      setRecordingWaveform([]);
    }
  };

  const playVoiceMessage = async (message) => {
    const messageId = message.id || message._id;
    if (playingVoiceMessage === messageId) {
      // Stop if already playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setPlayingVoiceMessage(null);
      setVoiceMessageProgress(0);
      return;
    }

    if (playingVoiceMessage) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }

    if (!message.voiceUrl && !message.audioUrl) {
      showToast("Voice message URL not available", "error");
      return;
    }

    setPlayingVoiceMessage(message.id);
    setVoiceMessageProgress(0);

    try {
      // Create audio element
      const audioUrl = message.voiceUrl || message.audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        const duration = audio.duration || message.duration || 5;
        const progressInterval = setInterval(() => {
          if (audio.ended || audio.currentTime >= duration) {
            clearInterval(progressInterval);
            setPlayingVoiceMessage(null);
            setVoiceMessageProgress(0);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === message.id ? { ...msg, played: true } : msg
              )
            );
            audioRef.current = null;
          } else {
            setVoiceMessageProgress((audio.currentTime / duration) * 100);
          }
        }, 100);
      };

      audio.onended = () => {
        setPlayingVoiceMessage(null);
        setVoiceMessageProgress(0);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, played: true } : msg
          )
        );
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        showToast("Failed to play voice message. The file may be corrupted.", "error");
        setPlayingVoiceMessage(null);
        setVoiceMessageProgress(0);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Failed to play voice message:", error);
      showToast("Failed to play voice message. Please try again.", "error");
      setPlayingVoiceMessage(null);
      setVoiceMessageProgress(0);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeRoom) {
      setTypingUsers([]);
      try {
        const roomId = activeRoom._id || activeRoom.id;
        if (!roomId) {
          throw new Error("Room ID is missing");
        }
        await CampfireApi.sendTextMessage(roomId, newMessage);
        setNewMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add message locally as fallback
        const mockMessage = {
          id: Date.now(),
          text: newMessage,
          username: "You",
          timestamp: new Date().toISOString(),
          isVoice: false,
        };
        setMessages((prev) => [...prev, mockMessage]);
        setNewMessage("");
      }
    }
  };

  const handleTyping = () => {
    if (!typingUsers.includes("You")) {
      setTypingUsers([...typingUsers, "You"]);
    }
    // Clear typing indicator after 3 seconds
    setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u !== "You"));
    }, 3000);
  };

  const joinRoom = async (room) => {
    try {
      const roomId = room._id || room.id;
      if (!roomId) {
        console.error("Room ID is missing");
        setActiveRoom(room);
        return;
      }
      const updatedRoom = await CampfireApi.joinRoom(roomId);
      // Ensure room has both _id and id for consistency
      const normalizedRoom = {
        ...updatedRoom,
        _id: updatedRoom._id || updatedRoom.id,
        id: updatedRoom._id || updatedRoom.id,
      };
      setActiveRoom(normalizedRoom);
      setRooms(rooms.map((r) => {
        const rId = r._id || r.id;
        return rId === roomId ? normalizedRoom : r;
      }));
    } catch (error) {
      console.error("Failed to join room:", error);
      // Ensure room has both _id and id for consistency
      const normalizedRoom = {
        ...room,
        _id: room._id || room.id,
        id: room._id || room.id,
      };
      setActiveRoom(normalizedRoom);
    }
  };

  const leaveRoom = async () => {
    if (activeRoom) {
      try {
        const roomId = activeRoom._id || activeRoom.id;
        if (roomId) {
          await CampfireApi.leaveRoom(roomId);
        }
      } catch (error) {
        console.error("Failed to leave room:", error);
      }
      setActiveRoom(null);
      setMessages([]);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (newRoom.name) {
      try {
        const room = await CampfireApi.createRoom(newRoom);
        // Normalize room to have both _id and id
        const normalizedRoom = {
          ...room,
          _id: room._id || room.id,
          id: room._id || room.id,
        };
        setRooms([...rooms, normalizedRoom]);
        setNewRoom({ name: "", maxParticipants: 12, isPrivate: false });
        setShowCreateRoom(false);
        setActiveRoom(normalizedRoom);
      } catch (error) {
        console.error("Failed to create room:", error);
        const mockRoom = {
          id: Date.now(),
          _id: Date.now(),
          ...newRoom,
          participants: [{ userId: "you", username: "You", avatar: "Y" }],
          isLive: false,
        };
        setRooms([...rooms, mockRoom]);
        setNewRoom({ name: "", maxParticipants: 12, isPrivate: false });
        setShowCreateRoom(false);
        setActiveRoom(mockRoom);
      }
    }
  };

  // Campfire animation component
  const CampfireAnimation = () => (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Fire glow */}
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/30 via-orange-500/20 to-transparent rounded-full animate-pulse"></div>
        {/* Fire particles */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
            style={{
              left: `${50 + Math.sin(i) * 20}%`,
              top: `${50 + Math.cos(i) * 20}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          ></div>
        ))}
        {/* Central fire */}
        <div className="relative z-10 text-6xl animate-pulse">🔥</div>
      </div>
    </div>
  );

  // Room list view
  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-900 via-black to-stone-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/feed")}
                className="text-amber-300 hover:text-amber-200 text-xl"
              >
                ←
              </button>
              <h1 className="text-3xl font-bold text-amber-400">Campfire</h1>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black flex items-center"
            >
              <span className="mr-2">+</span> Create Room
            </button>
          </div>

          {showCreateRoom && (
            <div className="bg-stone-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-amber-300">
                Create New Room
              </h2>
              <form onSubmit={handleCreateRoom}>
                <div className="mb-4">
                  <label className="block text-amber-200 mb-2">Room Name</label>
                  <input
                    type="text"
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter room name"
                    value={newRoom.name}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRoom.isPrivate}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, isPrivate: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-amber-200">Private room</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gold-gradient text-black font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-stone-900/90 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer"
                onClick={() => joinRoom(room)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-bold text-amber-300 mr-3">
                        {room.name}
                      </h3>
                      {room.isLive && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-red-400 text-sm">Live</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center -space-x-2 mb-3">
                      {room.participants?.slice(0, 5).map((p, idx) => (
                        <div
                          key={p.userId || idx}
                          className={`w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center border-2 border-stone-900 ${
                            p.isSpeaking ? "ring-2 ring-amber-400 animate-pulse" : ""
                          }`}
                        >
                          <span className="text-amber-200 text-sm font-bold">
                            {p.avatar}
                          </span>
                        </div>
                      ))}
                      {room.participants?.length > 5 && (
                        <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center border-2 border-stone-900">
                          <span className="text-amber-300 text-xs">
                            +{room.participants.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      joinRoom(room);
                    }}
                    className="bg-gold-gradient px-6 py-2 rounded-full font-semibold text-black hover:opacity-90"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full-screen campfire chat view
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-stone-900 via-black to-stone-900 z-50 animate-fadeIn overflow-x-hidden w-full max-w-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-amber-500/30 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={leaveRoom}
              className="text-amber-300 hover:text-amber-200 text-xl"
            >
              ←
            </button>
            <div>
              <h2 className="text-xl font-bold text-amber-300">
                {activeRoom.name}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-amber-400">
                <span>
                  {activeRoom.participants?.length || 0} members
                </span>
                {activeRoom.isLive && (
                  <>
                    <span>•</span>
                    <span className="text-red-400">Live</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddPeople(true)}
              className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 hover:bg-amber-500/30"
            >
              +
            </button>
            <button
              onClick={() => setShowRoomSettings(true)}
              className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 hover:bg-amber-500/30"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Campfire Animation */}
        <div className="flex-1 overflow-y-auto p-4">
          <CampfireAnimation />

          {/* Member Avatars Around Campfire */}
          {activeRoom.participants && activeRoom.participants.length > 0 && (
            <div className="relative mb-8 h-64 flex items-center justify-center">
              <div className="relative w-full h-full">
                {activeRoom.participants.map((participant, idx) => {
                  const angle = (idx / activeRoom.participants.length) * 360;
                  const radius = 120;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  const isSpeaking = speakingUsers.includes(participant.username);

                  return (
                    <div
                      key={participant.userId || idx}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center border-2 border-stone-900 transition-all ${
                          isSpeaking
                            ? "ring-4 ring-amber-400 animate-pulse scale-110"
                            : ""
                        }`}
                      >
                        <span className="text-amber-200 font-bold">
                          {participant.avatar}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((message) => {
              const messageId = message.id || message._id;
              return (
              <div
                key={messageId}
                className={`flex ${
                  message.username === "You" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.username === "You"
                      ? "bg-amber-500/30 text-amber-100 rounded-br-none"
                      : "bg-stone-800/50 text-amber-200 rounded-bl-none"
                  }`}
                >
                  {message.username !== "You" && (
                    <div className="text-xs font-semibold text-amber-400 mb-1">
                      {message.username}
                    </div>
                  )}
                  {message.isVoice ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => playVoiceMessage(message)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          playingVoiceMessage === messageId
                            ? "bg-amber-500 animate-pulse"
                            : "bg-amber-500/50 hover:bg-amber-500"
                        }`}
                      >
                        {playingVoiceMessage === messageId ? (
                          <span className="text-black">⏸</span>
                        ) : (
                          <span className="text-black">▶</span>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                            {playingVoiceMessage === messageId && (
                              <div
                                className="h-full bg-amber-400 transition-all duration-100"
                                style={{ width: `${voiceMessageProgress}%` }}
                              ></div>
                            )}
                          </div>
                          <span className="text-xs text-amber-400">
                            {message.duration || 5}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.text}</p>
                  )}
                  <div className="text-xs text-amber-400/70 mt-1 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-stone-800/50 px-4 py-2 rounded-2xl rounded-bl-none">
                  <div className="flex space-x-1">
                    <span className="text-amber-400 text-sm">
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                    </span>
                    <div className="flex space-x-1 items-center">
                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1 h-1 bg-amber-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-amber-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {recordingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-stone-800/50 px-4 py-2 rounded-2xl rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-amber-400 text-sm">
                      {recordingUsers.join(", ")} {recordingUsers.length === 1 ? "is" : "are"} recording
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-amber-500/30 bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-3">
            {/* Voice Record Button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500 animate-pulse scale-110"
                  : "bg-amber-500/30 hover:bg-amber-500/50"
              }`}
            >
              {isRecording ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs ml-1">{recordingTime}s</span>
                </div>
              ) : (
                <span className="text-2xl">🎤</span>
              )}
            </button>

            {/* Waveform Animation While Recording */}
            {isRecording && (
              <div className="flex-1 flex items-center space-x-1 h-12 bg-stone-800/50 rounded-lg px-4">
                {recordingWaveform.map((height, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-amber-400 rounded-full animate-pulse"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}

            {/* Text Input */}
            {!isRecording && (
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 bg-stone-800/50 border border-amber-500/30 rounded-full px-4 py-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}

            {/* Send Button - Show after recording stops */}
            {!isRecording && (newMessage.trim() || recordingTime > 0) && (
              <button
                type="submit"
                onClick={(e) => {
                  if (recordingTime > 0 && !newMessage.trim()) {
                    e.preventDefault();
                    // Voice message was just recorded, it's already sent in stopRecording
                    return;
                  }
                }}
                className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-600 transition-colors"
              >
                <span className="text-black text-xl">➤</span>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Add People Modal */}
      {showAddPeople && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Invite to Campfire
            </h2>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">Username</label>
              <input
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="Enter username to invite..."
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddPeople(false);
                  setInviteUsername("");
                }}
                className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!inviteUsername.trim()) {
                    showToast("Please enter a username", "warning");
                    return;
                  }
                  try {
                    // Send invite via API
                    const roomId = activeRoom._id || activeRoom.id;
                    if (!roomId) {
                      throw new Error("Room ID is missing");
                    }
                    await CampfireApi.inviteFriend(roomId, inviteUsername.trim());
                    // Reload room to get updated participants
                    const updatedRoom = await CampfireApi.getRoom(roomId);
                    const normalizedRoom = {
                      ...updatedRoom,
                      _id: updatedRoom._id || updatedRoom.id,
                      id: updatedRoom._id || updatedRoom.id,
                    };
                    setActiveRoom(normalizedRoom);
                    showToast(`Invite sent to @${inviteUsername}!`, "success");
                    setShowAddPeople(false);
                    setInviteUsername("");
                  } catch (error) {
                    console.error("Failed to send invite:", error);
                    showToast("Failed to send invite. User may not exist.", "error");
                  }
                }}
                className="px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Room Settings
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const roomName = formData.get("roomName");
                const isPrivate = formData.get("isPrivate") === "on";

                try {
                  // Save room settings via API
                  const roomId = activeRoom._id || activeRoom.id;
                  if (!roomId) {
                    throw new Error("Room ID is missing");
                  }
                  const updatedRoom = await CampfireApi.updateRoomSettings(roomId, {
                    name: roomName,
                    isActive: !isPrivate, // isActive = not private
                  });
                  const normalizedRoom = {
                    ...updatedRoom,
                    _id: updatedRoom._id || updatedRoom.id,
                    id: updatedRoom._id || updatedRoom.id,
                  };
                  setActiveRoom(normalizedRoom);
                  showToast("Room settings saved!", "success");
                  setShowRoomSettings(false);
                } catch (error) {
                  console.error("Failed to save settings:", error);
                  showToast("Failed to save settings", "error");
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-amber-200 mb-2">Room Name</label>
                  <input
                    type="text"
                    name="roomName"
                    defaultValue={activeRoom.name}
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPrivate"
                      defaultChecked={activeRoom.isPrivate}
                      className="mr-2"
                    />
                    <span className="text-amber-200">Make private</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRoomSettings(false)}
                  className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gold-gradient text-black font-semibold hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCampfire;

