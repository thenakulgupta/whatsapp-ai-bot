require("dotenv").config({
  path: "../../.env",
});

const config = {
  // Database
  mongodb: {
    uri:
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/whatsapp-ai-bot-support",
    dbName: process.env.MONGODB_DATABASE || "whatsapp-ai-bot-support",
  },

  // WhatsApp Business API
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiUrl: "https://graph.facebook.com/v24.0",
  },

  // AI Services
  ai: {
    groqApiKey: process.env.GROQ_API_KEY,
    defaultProvider: process.env.AI_PROVIDER || "groq",
  },

  // Translation
  translation: {
    googleApiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.BACKEND_PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  },

  // Admin Dashboard
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  },

  // Session Configuration
  session: {
    expiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS) || 24,
    maxContextSize: parseInt(process.env.MAX_SESSION_CONTEXT_SIZE) || 1000,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },

  // Dashboard
  dashboard: {
    url:
      process.env.DASHBOARD_URL ||
      `http://localhost:${process.env.FRONTEND_PORT}`,
  },
};

// Validation
const requiredEnvVars = [
  "MONGODB_URI",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && config.server.nodeEnv === "production") {
  console.error("Missing required environment variables:", missingVars);
  process.exit(1);
}

module.exports = config;
