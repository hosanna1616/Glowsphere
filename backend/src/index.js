const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/campfire", require("./routes/campfireRoutes"));
app.use("/api/quests", require("./routes/questRoutes"));
app.use("/api/study", require("./routes/studyRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/challenges", require("./routes/challengeRoutes"));

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

  // Voice message
  socket.on("send_voice_message", (data) => {
    socket.to(data.roomId).emit("receive_voice_message", data);
    console.log("Voice message sent:", data);
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

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`✅ Socket.IO server is running on ws://${HOST}:${PORT}`);
  console.log(`✅ API available at http://${HOST}:${PORT}/api`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
});
