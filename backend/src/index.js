const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { setIo } = require("./socket");
const { generalLimiter } = require("./middleware/rateLimiter");
const securitySanitizer = require("./middleware/securitySanitizer");

// Load environment variables
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";

// Create Express app
const app = express();
const server = http.createServer(app);
app.disable("x-powered-by");
app.set("trust proxy", 1);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...envAllowedOrigins]),
];
const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);
const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error("CORS policy violation"));
};

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
setIo(io);

// Middleware
app.use(
  cors({
    origin: corsOriginHandler,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  helmet({
    // this fix profile not uploading error
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Enable only if you intentionally adopt cross-origin isolation.
    crossOriginEmbedderPolicy: false,
    // Enforce HSTS only in production over HTTPS.
    hsts: isProduction
      ? { maxAge: 15552000, includeSubDomains: true, preload: true }
      : false,
  }),
);
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(securitySanitizer);
app.use("/api", generalLimiter);

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/campfire", require("./routes/campfireRoutes"));
app.use("/api/quests", require("./routes/questRoutes"));
app.use("/api/study", require("./routes/studyRoutes"));
app.use("/api/study-sessions", require("./routes/studySessionRoutes"));
app.use("/api/study-pods", require("./routes/studyPodRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/challenges", require("./routes/challengeRoutes"));
app.use("/api/parallel-bloom", require("./routes/parallelBloomRoutes"));
app.use("/api/echoes", require("./routes/echoesRoutes"));
app.use("/api/lumina-logs", require("./routes/luminaLogRoutes"));

// Monitoring endpoint
app.get("/monitoring", (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    },
    cpu: {
      user: `${cpuUsage.user / 1000}ms`,
      system: `${cpuUsage.system / 1000}ms`,
    },
  });
});

// Error handler middleware (should be last middleware)
app.use(errorHandler);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("join_room", (data) => {
    socket.join(data.roomId);
    console.log(`User ${socket.id} joined room ${data.roomId}`);
  });

  // Send message
  socket.on("send_message", (data) => {
    socket.to(data.roomId).emit("receive_message", data);
    console.log("Message sent:", data);
  });

  socket.on("campfire_invite_sent", (data) => {
    if (!data?.roomId) {
      return;
    }
    socket.to(data.roomId).emit("campfire_invite_sent", data);
  });

  socket.on("campfire_game_sync", (data) => {
    if (!data?.roomId) {
      return;
    }
    socket.to(data.roomId).emit("campfire_game_sync", data);
  });

  socket.on("campfire_reaction", (data) => {
    if (!data?.roomId) {
      return;
    }
    socket.to(data.roomId).emit("campfire_reaction", data);
  });

  socket.on("campfire_voice_answer", (data) => {
    if (!data?.roomId) {
      return;
    }
    socket.to(data.roomId).emit("campfire_voice_answer", data);
  });

  socket.on("campfire_message_deleted", (data) => {
    if (!data?.roomId) {
      return;
    }
    socket.to(data.roomId).emit("campfire_message_deleted", data);
  });

  // Voice message
  socket.on("send_voice_message", (data) => {
    socket.to(data.roomId).emit("receive_voice_message", data);
    console.log("Voice message sent:", data);
  });

  socket.on("join_study_pod", (data) => {
    socket.join(`study_pod:${data.podId}`);
  });

  socket.on("study_progress_update", (data) => {
    socket.to(`study_pod:${data.podId}`).emit("study_progress_update", data);
  });

  socket.on("study_reaction", (data) => {
    socket.to(`study_pod:${data.podId}`).emit("study_reaction", data);
  });

  socket.on("study_session_state", (data) => {
    socket.to(`study_pod:${data.podId}`).emit("study_session_state", data);
  });

  socket.on("study_debrief_message", (data) => {
    socket.to(`study_pod:${data.podId}`).emit("study_debrief_message", data);
  });

  socket.on("study_debrief_voice", (data) => {
    socket.to(`study_pod:${data.podId}`).emit("study_debrief_voice", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "GlowSphere API Server is running!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server only after MongoDB connection
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await connectDB();
    console.log("✅ MongoDB connection established!");

    const PORT = process.env.PORT || 5002; // Changed to 5002 to match frontend
    const HOST = process.env.HOST || "0.0.0.0";

    server.listen(PORT, HOST, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`✅ Socket.IO server is running on ws://${HOST}:${PORT}`);
      console.log(`✅ API available at http://${HOST}:${PORT}/api`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error("❌ Make sure your MongoDB Atlas IP is whitelisted!");
    console.error("❌ Retrying connection in 10 seconds...");

    // Retry after 10 seconds
    setTimeout(() => {
      startServer();
    }, 10000);
  }
};

startServer();
