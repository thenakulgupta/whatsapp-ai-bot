// Type definitions and validation schemas

/**
 * User session data structure
 * @typedef {Object} UserSession
 * @property {string} userPhone - User's WhatsApp phone number
 * @property {string} activeModule - Currently active module ID
 * @property {Date} lastMessageAt - Timestamp of last message
 * @property {Object} contextData - Session context and memory
 * @property {boolean} isActive - Whether session is active
 * @property {number} messageCount - Number of messages in session
 * @property {Date} startTime - Session start time
 * @property {Date} endTime - Session end time (if ended)
 * @property {string} language - User's preferred language
 * @property {Object} userPreferences - User preferences
 * @property {number} escalationCount - Number of escalations in session
 * @property {Date} lastEscalationAt - Timestamp of last escalation
 */

/**
 * Chat message data structure
 * @typedef {Object} ChatMessage
 * @property {string} userPhone - User's WhatsApp phone number
 * @property {string} moduleId - Module ID where message was sent
 * @property {ObjectId} sessionId - Reference to session
 * @property {string} message - Message content
 * @property {string} senderType - Type of sender (user, ai, human)
 * @property {string} messageType - Type of message (text, image, etc.)
 * @property {string} intent - Detected intent
 * @property {number} confidence - Confidence score for intent detection
 * @property {Object} functionCalled - Function call details
 * @property {string} response - AI response
 * @property {number} responseTime - Response time in milliseconds
 * @property {string} language - Message language
 * @property {boolean} isEscalated - Whether message was escalated
 * @property {ObjectId} escalatedTo - Agent who handled escalation
 * @property {Date} escalatedAt - Escalation timestamp
 * @property {ObjectId} ticketId - Associated ticket ID
 * @property {Object} metadata - Additional metadata
 * @property {string} status - Message status
 * @property {Object} error - Error details if failed
 */

/**
 * Ticket data structure
 * @typedef {Object} Ticket
 * @property {ObjectId} chatId - Reference to chat
 * @property {string} moduleId - Module ID
 * @property {string} userPhone - User's phone number
 * @property {ObjectId} sessionId - Reference to session
 * @property {string} title - Ticket title
 * @property {string} description - Ticket description
 * @property {string} priority - Ticket priority (low, medium, high, urgent)
 * @property {string} status - Ticket status
 * @property {string} category - Ticket category
 * @property {ObjectId} assignedTo - Assigned agent
 * @property {Date} assignedAt - Assignment timestamp
 * @property {Date} resolvedAt - Resolution timestamp
 * @property {Date} closedAt - Closure timestamp
 * @property {string} resolution - Resolution details
 * @property {Array} tags - Ticket tags
 * @property {Array} attachments - File attachments
 * @property {Array} notes - Agent notes
 * @property {number} escalationLevel - Escalation level
 * @property {ObjectId} escalatedFrom - Previous agent
 * @property {Date} escalatedAt - Escalation timestamp
 * @property {Date} slaDeadline - SLA deadline
 * @property {number} responseTime - Response time in minutes
 * @property {number} resolutionTime - Resolution time in minutes
 * @property {Object} customerSatisfaction - Satisfaction rating
 * @property {Object} metadata - Additional metadata
 */

/**
 * Agent data structure
 * @typedef {Object} Agent
 * @property {string} name - Agent name
 * @property {string} email - Agent email
 * @property {string} password - Hashed password
 * @property {string} phone - Agent phone number
 * @property {string} avatar - Avatar URL
 * @property {string} role - Agent role (admin, supervisor, agent)
 * @property {boolean} isActive - Whether agent is active
 * @property {Array} assignedModules - Modules agent can handle
 * @property {number} maxConcurrentTickets - Maximum concurrent tickets
 * @property {Object} workingHours - Working hours configuration
 * @property {Array} skills - Agent skills
 * @property {Array} languages - Supported languages
 * @property {Object} stats - Performance statistics
 * @property {Array} currentTickets - Currently assigned tickets
 * @property {Date} lastActiveAt - Last activity timestamp
 * @property {boolean} isOnline - Online status
 * @property {Object} preferences - Agent preferences
 * @property {Object} metadata - Additional metadata
 */

/**
 * Module data structure
 * @typedef {Object} Module
 * @property {string} id - Module identifier
 * @property {string} name - Module display name
 * @property {string} description - Module description
 * @property {string} icon - Module icon
 * @property {boolean} isActive - Whether module is active
 * @property {Object} config - Module configuration
 * @property {Array} functions - Available functions
 * @property {string} welcomeMessage - Welcome message
 * @property {string} exitMessage - Exit message
 * @property {Object} stats - Module statistics
 */

/**
 * Function definition structure
 * @typedef {Object} FunctionDefinition
 * @property {string} name - Function name
 * @property {string} description - Function description
 * @property {Object} parameters - Parameter definitions
 * @property {Array} required - Required parameters
 * @property {Array} examples - Usage examples
 */

/**
 * WhatsApp message structure
 * @typedef {Object} WhatsAppMessage
 * @property {string} messageId - WhatsApp message ID
 * @property {string} from - Sender phone number
 * @property {number} timestamp - Message timestamp
 * @property {string} type - Message type
 * @property {string} text - Message text content
 * @property {Object} context - Message context
 * @property {Object} contact - Contact information
 * @property {Object} metadata - WhatsApp metadata
 */

/**
 * AI response structure
 * @typedef {Object} AIResponse
 * @property {boolean} success - Whether response was successful
 * @property {string} response - Response text
 * @property {string} functionName - Function that was called
 * @property {Object} parameters - Function parameters
 * @property {Object} result - Function execution result
 * @property {number} confidence - Confidence score
 * @property {string} reasoning - AI reasoning
 * @property {string} error - Error message if failed
 */

/**
 * Analytics data structure
 * @typedef {Object} AnalyticsData
 * @property {number} totalChats - Total number of chats
 * @property {number} activeChats - Currently active chats
 * @property {number} totalTickets - Total number of tickets
 * @property {number} openTickets - Currently open tickets
 * @property {number} totalAgents - Total number of agents
 * @property {number} onlineAgents - Currently online agents
 * @property {number} totalSessions - Total number of sessions
 * @property {number} activeSessions - Currently active sessions
 * @property {number} averageResponseTime - Average response time
 * @property {number} escalationRate - Escalation rate percentage
 */

/**
 * WebSocket event structure
 * @typedef {Object} WebSocketEvent
 * @property {string} event - Event name
 * @property {Object} data - Event data
 * @property {string} timestamp - Event timestamp
 * @property {string} clientId - Client identifier
 * @property {string} moduleId - Module identifier
 */

// Validation schemas
const VALIDATION_SCHEMAS = {
  userPhone: {
    type: "string",
    pattern: "^\\+[1-9]\\d{1,14}$",
    required: true,
  },

  moduleId: {
    type: "string",
    pattern: "^[a-z_]+$",
    minLength: 2,
    maxLength: 50,
    required: true,
  },

  message: {
    type: "string",
    minLength: 1,
    maxLength: 4096,
    required: true,
  },

  ticketPriority: {
    type: "string",
    enum: ["low", "medium", "high", "urgent"],
    required: true,
  },

  ticketStatus: {
    type: "string",
    enum: [
      "open",
      "assigned",
      "in_progress",
      "resolved",
      "closed",
      "cancelled",
    ],
    required: true,
  },

  agentRole: {
    type: "string",
    enum: ["admin", "supervisor", "agent"],
    required: true,
  },

  chatStatus: {
    type: "string",
    enum: ["pending", "processing", "completed", "failed", "escalated"],
    required: true,
  },

  messageType: {
    type: "string",
    enum: [
      "text",
      "image",
      "document",
      "audio",
      "video",
      "location",
      "contact",
      "interactive",
    ],
    required: true,
  },

  senderType: {
    type: "string",
    enum: ["user", "ai", "human"],
    required: true,
  },
};

// Helper functions for validation
const validators = {
  /**
   * Validate user phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether phone is valid
   */
  isValidPhone: (phone) => {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  },

  /**
   * Validate module ID
   * @param {string} moduleId - Module ID to validate
   * @returns {boolean} - Whether module ID is valid
   */
  isValidModuleId: (moduleId) => {
    return (
      /^[a-z_]+$/.test(moduleId) &&
      moduleId.length >= 2 &&
      moduleId.length <= 50
    );
  },

  /**
   * Validate message content
   * @param {string} message - Message to validate
   * @returns {boolean} - Whether message is valid
   */
  isValidMessage: (message) => {
    return (
      typeof message === "string" &&
      message.length >= 1 &&
      message.length <= 4096
    );
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate enum value
   * @param {string} value - Value to validate
   * @param {Array} allowedValues - Allowed values
   * @returns {boolean} - Whether value is valid
   */
  isValidEnum: (value, allowedValues) => {
    return allowedValues.includes(value);
  },

  /**
   * Validate object against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} - Validation result
   */
  validateObject: (obj, schema) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = obj[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(
            `${field} must be at least ${rules.minLength} characters long`
          );
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(
            `${field} must be at most ${rules.maxLength} characters long`
          );
        }

        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push(`${field} format is invalid`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

module.exports = {
  VALIDATION_SCHEMAS,
  validators,
};
