// Application constants
const CONSTANTS = {
  // Session management
  SESSION: {
    EXPIRY_HOURS: 24,
    MAX_CONTEXT_SIZE: 1000,
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  },

  // Message types
  MESSAGE_TYPES: {
    TEXT: "text",
    IMAGE: "image",
    DOCUMENT: "document",
    AUDIO: "audio",
    VIDEO: "video",
    LOCATION: "location",
    CONTACT: "contact",
    INTERACTIVE: "interactive",
  },

  // Sender types
  SENDER_TYPES: {
    USER: "user",
    AI: "ai",
    HUMAN: "human",
  },

  // Chat statuses
  CHAT_STATUS: {
    PENDING: "pending",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
    ESCALATED: "escalated",
  },

  // Ticket statuses
  TICKET_STATUS: {
    OPEN: "open",
    ASSIGNED: "assigned",
    IN_PROGRESS: "in_progress",
    RESOLVED: "resolved",
    CLOSED: "closed",
    CANCELLED: "cancelled",
  },

  // Ticket priorities
  TICKET_PRIORITY: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
  },

  // Agent roles
  AGENT_ROLES: {
    ADMIN: "admin",
    SUPERVISOR: "supervisor",
    AGENT: "agent",
  },

  // Agent statuses
  AGENT_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
    BUSY: "busy",
    AWAY: "away",
  },

  // Module configuration
  MODULE: {
    MAX_FUNCTIONS: 20,
    MAX_FUNCTION_PARAMETERS: 10,
    DEFAULT_ICON: "🏢",
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MESSAGE_WINDOW_MS: 60 * 1000, // 1 minute
    MAX_MESSAGES: 10,
  },

  // WhatsApp API
  WHATSAPP: {
    API_VERSION: "v18.0",
    MAX_MESSAGE_LENGTH: 4096,
    MAX_BUTTONS: 3,
    MAX_LIST_ITEMS: 10,
    MAX_SECTIONS: 10,
  },

  // AI Configuration
  AI: {
    DEFAULT_PROVIDER: "groq",
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    MAX_RETRIES: 3,
    TIMEOUT: 30000,
  },

  // File upload
  UPLOAD: {
    MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
    ALLOWED_TYPES: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
    ],
    UPLOAD_PATH: "uploads/",
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },

  // Analytics
  ANALYTICS: {
    DEFAULT_PERIOD: "7d",
    SUPPORTED_PERIODS: ["24h", "7d", "30d", "90d"],
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  },

  // WebSocket events
  WS_EVENTS: {
    // Client events
    AUTHENTICATE: "authenticate",
    AGENT_AUTHENTICATE: "agent_authenticate",
    SELECT_MODULE: "select_module",
    MESSAGE_STATUS: "message_status",
    AGENT_STATUS: "agent_status",
    ESCALATE_CHAT: "escalate_chat",
    ASSIGN_CHAT: "assign_chat",

    // Server events
    AUTHENTICATED: "authenticated",
    AGENT_AUTHENTICATED: "agent_authenticated",
    MODULE_SELECTED: "module_selected",
    MESSAGE_STATUS_UPDATE: "message_status_update",
    NEW_CHAT: "new_chat",
    CHAT_UPDATED: "chat_updated",
    CHAT_ESCALATED: "chat_escalated",
    NEW_TICKET: "new_ticket",
    TICKET_UPDATED: "ticket_updated",
    TICKET_ASSIGNED: "ticket_assigned",
    AGENT_ONLINE: "agent_online",
    AGENT_OFFLINE: "agent_offline",
    AGENT_STATUS_UPDATE: "agent_status_update",
    ANALYTICS_UPDATED: "analytics_updated",
    ERROR: "error",
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMITED: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Database indexes
  DB_INDEXES: {
    CHAT: ["userPhone", "moduleId", "createdAt", "status", "isEscalated"],
    TICKET: ["moduleId", "status", "priority", "assignedTo", "createdAt"],
    SESSION: ["userPhone", "activeModule", "isActive", "lastMessageAt"],
    AGENT: ["email", "role", "isActive", "isOnline", "assignedModules"],
    MODULE: ["id", "isActive", "createdAt"],
  },

  // Logging levels
  LOG_LEVELS: {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
  },

  // Environment
  ENVIRONMENTS: {
    DEVELOPMENT: "development",
    STAGING: "staging",
    PRODUCTION: "production",
  },
};

module.exports = CONSTANTS;
