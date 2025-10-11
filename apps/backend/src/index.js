const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config({
  path: "../../.env",
});

const { connectDB } = require("./db/connect");
const logger = require("./config/logger");
const { initializeModules } = require("./modules/registry");

// Import routes
const webhookRoutes = require("./routes/webhook");
const adminRoutes = require("./routes/admin");
const chatRoutes = require("./routes/chats");
const ticketRoutes = require("./routes/tickets");
const analyticsRoutes = require("./routes/analytics");

// Import services
const { initializeWebSocket } = require("./services/wsHub");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.DASHBOARD_URL ||
      `http://localhost:${process.env.FRONTEND_PORT}`,
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.BACKEND_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.DASHBOARD_URL ||
      `http://localhost:${process.env.FRONTEND_PORT}`,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API routes
app.use("/webhook", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Initialize application
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info("Connected to MongoDB");

    // Initialize module registry
    await initializeModules();
    logger.info("Module registry initialized");

    // Initialize WebSocket hub
    initializeWebSocket(io);
    logger.info("WebSocket hub initialized");

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io };
