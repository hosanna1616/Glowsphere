import React, { useState, useRef, useEffect } from "react";
import CampfireApi from "../../api/campfireApi";
import apiClient from "../../api/apiClient";

const Campfire = () => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    maxParticipants: 12,
  });

  // Messaging states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Load rooms on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const roomData = await CampfireApi.getRooms();
        setRooms(roomData);
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }
    };

    loadRooms();

    // Periodically refresh rooms
    const roomRefreshInterval = setInterval(async () => {
      try {
        const roomData = await CampfireApi.getRooms();
        setRooms(roomData);
      } catch (error) {
        console.error("Failed to refresh rooms:", error);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(roomRefreshInterval);
  }, []);

  // Load messages and subscribe to updates when active room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (activeRoom) {
        try {
          const messageData = await CampfireApi.getMessages(activeRoom.id);
          setMessages(messageData);

          // Subscribe to real-time updates
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }

          unsubscribeRef.current = CampfireApi.subscribeToRoom(
            activeRoom.id,
            (updatedMessages) => {
              setMessages(updatedMessages);
            }
          );
        } catch (error) {
          console.error("Failed to load messages:", error);
        }
      } else {
        // Unsubscribe when leaving room
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
        unsubscribeRef.current = null;
      }
    };
  }, [activeRoom]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (newRoom.name) {
      try {
        const roomData = {
          name: newRoom.name,
          maxParticipants: parseInt(newRoom.maxParticipants),
        };

        const token = apiClient.getToken();
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(
          `${apiClient.getApiBaseUrl()}/campfire/rooms`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(roomData),
          }
        );

        if (!response.ok) {
          // If backend is not available, create room in localStorage as fallback
          if (
            response.status === 500 ||
            response.status === 503 ||
            response.status === 0
          ) {
            // Create mock room
            const mockRoom = {
              id: Date.now(),
              ...roomData,
              participants: [{ username: "You", userId: "you", isHost: true }],
              host: "You",
              createdAt: new Date().toISOString(),
            };

            setRooms([...rooms, mockRoom]);
            setNewRoom({ name: "", maxParticipants: 12 });
            setShowCreateRoom(false);
            // Automatically join the newly created room
            setActiveRoom(mockRoom);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const room = await response.json();

        setRooms([...rooms, room]);
        setNewRoom({ name: "", maxParticipants: 12 });
        setShowCreateRoom(false);
        // Automatically join the newly created room
        setActiveRoom(room);
      } catch (error) {
        // Fallback to localStorage if network error
        if (error instanceof TypeError && error.message.includes("fetch")) {
          try {
            // Create mock room
            const mockRoom = {
              id: Date.now(),
              name: newRoom.name,
              maxParticipants: parseInt(newRoom.maxParticipants),
              participants: [{ username: "You", userId: "you", isHost: true }],
              host: "You",
              createdAt: new Date().toISOString(),
            };

            setRooms([...rooms, mockRoom]);
            setNewRoom({ name: "", maxParticipants: 12 });
            setShowCreateRoom(false);
            // Automatically join the newly created room
            setActiveRoom(mockRoom);
            alert("Room created in offline mode.");
            return;
          } catch (storageError) {
            console.error(
              "Failed to create room in localStorage:",
              storageError
            );
          }
        }
        console.error("Failed to create room:", error);
        alert("Failed to create room. Please try again.");
      }
    }
  };

  const joinRoom = async (room) => {
    try {
      const updatedRoom = await CampfireApi.joinRoom(room.id);
      setActiveRoom(updatedRoom);

      // Update rooms list
      setRooms(rooms.map((r) => (r.id === room.id ? updatedRoom : r)));
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const leaveRoom = async () => {
    if (activeRoom) {
      try {
        await CampfireApi.leaveRoom(activeRoom.id);
        setActiveRoom(null);
        setMessages([]);
      } catch (error) {
        console.error("Failed to leave room:", error);
      }
    }
  };

  const toggleAudio = async () => {
    if (activeRoom) {
      try {
        const updatedRoom = await CampfireApi.toggleParticipantAudio(
          activeRoom.id,
          activeRoom.participants.find((p) => p.username === "You")?.userId
        );

        // Update local state
        setActiveRoom(updatedRoom);
        setRooms(rooms.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
      } catch (error) {
        console.error("Failed to toggle audio:", error);
      }
    }
  };

  const toggleVideo = async () => {
    if (activeRoom) {
      try {
        const updatedRoom = await CampfireApi.toggleParticipantVideo(
          activeRoom.id,
          activeRoom.participants.find((p) => p.username === "You")?.userId
        );

        // Update local state
        setActiveRoom(updatedRoom);
        setRooms(rooms.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
      } catch (error) {
        console.error("Failed to toggle video:", error);
      }
    }
  };

  // Message functions
  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeRoom) {
      try {
        const message = await CampfireApi.sendTextMessage(
          activeRoom.id,
          newMessage
        );

        // Clear input
        setNewMessage("");

        // The message will be added via subscription
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);

      // Simulate sending a voice message
      if (recordingTime > 0 && activeRoom) {
        try {
          const message = await CampfireApi.sendVoiceMessage(activeRoom.id, {
            duration: recordingTime,
          });

          // Reset recording time
          setRecordingTime(0);
        } catch (error) {
          console.error("Failed to send voice message:", error);
        }
      }
    }
  };

  const playVoiceMessage = (message) => {
    alert(`Playing voice message: ${message.text} (${message.duration || 5}s)`);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-400">Campfire</h1>
        {!activeRoom && (
          <button
            className="bg-gold-gradient px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center text-black"
            onClick={() => setShowCreateRoom(!showCreateRoom)}
          >
            <span className="mr-2">+</span> Create Room
          </button>
        )}
        {activeRoom && (
          <button
            className="bg-red-500 px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-white"
            onClick={leaveRoom}
          >
            Leave Room
          </button>
        )}
      </div>

      {/* Create Room Form */}
      {showCreateRoom && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-amber-300">
            Create New Room
          </h2>
          <form onSubmit={handleCreateRoom}>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">Room Name</label>
              <input
                type="text"
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter room name"
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-amber-200 mb-2">
                Max Participants
              </label>
              <select
                className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={newRoom.maxParticipants}
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    maxParticipants: parseInt(e.target.value),
                  })
                }
              >
                {[2, 4, 6, 8, 10, 12].map((num) => (
                  <option key={num} value={num}>
                    {num} participants
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-amber-500/30 text-amber-300 hover:bg-stone-800 transition-colors"
                onClick={() => setShowCreateRoom(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Room View */}
      {activeRoom && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-amber-300">
              {activeRoom.name}
            </h2>
            <div className="flex items-center">
              <span className="bg-green-500 w-3 h-3 rounded-full mr-2"></span>
              <span className="text-amber-200">
                {activeRoom.participants?.length || 0}/
                {activeRoom.maxParticipants} participants
              </span>
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {activeRoom.participants?.slice(0, 8).map((participant, index) => (
              <div
                key={participant.userId || index}
                className="aspect-video bg-stone-800 rounded-lg flex items-center justify-center relative border-2 border-amber-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 to-black rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl text-amber-300">
                        {participant.username?.charAt(0) || "U"}
                      </span>
                    </div>
                    <p className="text-amber-200 text-sm truncate px-2">
                      {participant.username || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 flex space-x-1">
                  {participant.isAudioOn ? (
                    <span className="text-amber-300">🔊</span>
                  ) : (
                    <span className="text-red-400">🔇</span>
                  )}
                  {!participant.isVideoOn && (
                    <span className="text-amber-300">📷</span>
                  )}
                </div>
                {participant.isHost && (
                  <div className="absolute top-2 left-2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full">
                    Host
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chat Container */}
          <div className="bg-stone-900 rounded-xl border border-amber-500/30 mb-6">
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id || message.id}
                  className={`flex ${
                    message.username === "You" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.username === "You"
                        ? "bg-amber-500/20 text-amber-100 rounded-br-none"
                        : "bg-stone-800 text-amber-200 rounded-bl-none"
                    }`}
                  >
                    {message.username !== "You" && (
                      <div className="text-xs font-semibold text-amber-400 mb-1">
                        {message.username}
                      </div>
                    )}
                    {message.isVoice ? (
                      <div className="flex items-center space-x-2">
                        <button
                          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center"
                          onClick={() => playVoiceMessage(message)}
                        >
                          <span className="text-black">▶️</span>
                        </button>
                        <span className="text-sm">
                          Voice message ({message.duration || 5}s)
                        </span>
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
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-amber-500/30 p-4">
              <form
                onSubmit={sendMessage}
                className="flex items-center space-x-2"
              >
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isRecording
                      ? "bg-red-500 animate-pulse"
                      : "bg-stone-700 hover:bg-stone-600"
                  } transition-colors`}
                >
                  <span className="text-lg">🎤</span>
                </button>
                {isRecording && (
                  <div className="text-red-400 text-sm">
                    Recording... {recordingTime}s
                  </div>
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-stone-800 border border-amber-500/30 rounded-full px-4 py-2 text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center disabled:opacity-50"
                >
                  <span className="text-black">➤</span>
                </button>
              </form>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-6 py-4">
            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                activeRoom.participants?.find((p) => p.username === "You")
                  ?.isAudioOn
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-stone-700 hover:bg-stone-600"
              }`}
              onClick={toggleAudio}
            >
              <span className="text-2xl">
                {activeRoom.participants?.find((p) => p.username === "You")
                  ?.isAudioOn
                  ? "🔊"
                  : "🔇"}
              </span>
            </button>
            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                activeRoom.participants?.find((p) => p.username === "You")
                  ?.isVideoOn
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-stone-700 hover:bg-stone-600"
              }`}
              onClick={toggleVideo}
            >
              <span className="text-2xl">
                {activeRoom.participants?.find((p) => p.username === "You")
                  ?.isVideoOn
                  ? "📷"
                  : "❌"}
              </span>
            </button>
            <button
              className="w-14 h-14 rounded-full bg-stone-700 flex items-center justify-center hover:bg-stone-600 transition-colors"
              onClick={() => console.log("Raise hand")}
            >
              <span className="text-2xl">✋</span>
            </button>
          </div>
        </div>
      )}

      {/* Rooms List */}
      {!activeRoom && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-amber-300">Available Rooms</h2>
          {rooms.map((room) => (
            <div
              key={room._id || room.id}
              className="bg-card-bg backdrop-blur-sm rounded-xl p-6 border border-amber-500/30 hover:border-amber-400 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-amber-300">
                    {room.name}
                  </h3>
                  <div className="flex items-center text-amber-200 text-sm mb-4">
                    <span>Hosted by {room.hostName || room.host}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {room.participants?.length || 0}/{room.maxParticipants}{" "}
                      participants
                    </span>
                  </div>
                </div>
                <button
                  className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
                  onClick={() => joinRoom(room)}
                  disabled={room.participants?.length >= room.maxParticipants}
                >
                  {room.participants?.length >= room.maxParticipants
                    ? "Full"
                    : "Join"}
                </button>
              </div>

              {/* Preview of participants */}
              <div className="flex -space-x-2">
                {room.participants?.slice(0, 5).map((participant, index) => (
                  <div
                    key={participant.userId || index}
                    className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-card-bg"
                  >
                    <span className="text-amber-300 text-sm">
                      {participant.username?.charAt(0) || "U"}
                    </span>
                  </div>
                ))}
                {room.participants?.length > 5 && (
                  <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center border-2 border-card-bg">
                    <span className="text-amber-300 text-sm">
                      +{room.participants.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campfire;
