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
const demoDataEcommerceRoutes = require("./routes/demoDataEcommerceRoutes");
const demoDataRealEstateRoutes = require("./routes/demoDataRealEstateRoutes");

// Import services
const { initializeWebSocket } = require("./services/wsHub");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.DASHBOARD_URL,
        `http://localhost:${process.env.FRONTEND_PORT}`,
        `https://localhost:${process.env.FRONTEND_PORT}`,
        // Add your production domain here
        "https://whatsapp-ai-bot-projects.nakulgupta.in",
        "http://whatsapp-ai-bot-projects.nakulgupta.in",
        process.env.DASHBOARD_URL,
      ].filter(Boolean);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Enable HTTPS support for WebSocket
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

const PORT = process.env.BACKEND_PORT || 3000;

// Trust proxy configuration for reverse proxy setups (nginx, load balancers, etc.)
// This is essential for accurate IP detection with express-rate-limit
if (
  process.env.NODE_ENV === "production" ||
  process.env.TRUST_PROXY === "true"
) {
  app.set("trust proxy", true);
  logger.info("Trust proxy enabled for production environment");
} else if (process.env.TRUST_PROXY === "true") {
  // Allow custom trust proxy configuration
  app.set("trust proxy", process.env.TRUST_PROXY);
  logger.info(`Trust proxy configured: ${process.env.TRUST_PROXY}`);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.DASHBOARD_URL,
      `http://localhost:${process.env.FRONTEND_PORT}`,
      "https://whatsapp-ai-bot-projects.nakulgupta.in",
      "http://whatsapp-ai-bot-projects.nakulgupta.in",
    ].filter(Boolean),
    credentials: true,
  })
);

// Rate limiting with proper proxy support
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Trust proxy is already configured above, so this will work correctly
  trustProxy: true,
  // Skip successful requests from rate limiting (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests from rate limiting (optional)
  skipFailedRequests: false,
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
app.use("/demo-data/ecommerce", demoDataEcommerceRoutes);
app.use("/demo-data/real-estate", demoDataRealEstateRoutes);

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
