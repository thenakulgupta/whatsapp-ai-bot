import { io } from "socket.io-client";
import toast from "react-hot-toast";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Determine the WebSocket URL based on environment
    const wsUrl = this.getWebSocketUrl();

    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
      // Enable secure connections for HTTPS
      secure: window.location.protocol === "https:",
      // Auto-upgrade to secure WebSocket when available
      upgrade: true,
      // Handle connection errors gracefully
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Get WebSocket URL based on environment
   */
  getWebSocketUrl() {
    // In production with HTTPS, use the same origin
    if (window.location.protocol === "https:") {
      return window.location.origin;
    }

    // In development or HTTP, use the configured backend URL
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    return backendUrl;
  }

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      toast.success("Connected to live updates");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isConnected = false;

      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket error occurred");
    });

    // Message status updates
    this.socket.on("message_status_update", (data) => {
      this.emit("message_status_update", data);
    });

    // Chat updates
    this.socket.on("new_chat", (data) => {
      this.emit("new_chat", data);
    });

    this.socket.on("chat_updated", (data) => {
      this.emit("chat_updated", data);
    });

    this.socket.on("chat_escalated", (data) => {
      this.emit("chat_escalated", data);
      toast.info(`Chat escalated: ${data.chatId}`);
    });

    // Ticket updates
    this.socket.on("new_ticket", (data) => {
      this.emit("new_ticket", data);
      toast.info(`New ticket created: ${data.ticketId}`);
    });

    this.socket.on("ticket_updated", (data) => {
      this.emit("ticket_updated", data);
    });

    this.socket.on("ticket_assigned", (data) => {
      this.emit("ticket_assigned", data);
      toast.info(`Ticket assigned: ${data.ticketId}`);
    });

    // Agent updates
    this.socket.on("agent_online", (data) => {
      this.emit("agent_online", data);
    });

    this.socket.on("agent_offline", (data) => {
      this.emit("agent_offline", data);
    });

    this.socket.on("agent_status_update", (data) => {
      this.emit("agent_status_update", data);
    });

    // Module updates
    this.socket.on("module_selected", (data) => {
      this.emit("module_selected", data);
    });

    // Analytics updates
    this.socket.on("analytics_updated", (data) => {
      this.emit("analytics_updated", data);
    });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      toast.error("Connection lost. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Authenticate as client
   */
  authenticate(clientId, moduleId = null) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.emit("authenticate", {
      clientId,
      moduleId,
    });
  }

  /**
   * Authenticate as agent
   */
  authenticateAgent(agentId, agentRole, assignedModules = []) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.emit("agent_authenticate", {
      agentId,
      agentRole,
      assignedModules,
    });
  }

  /**
   * Select module
   */
  selectModule(moduleId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("select_module", { moduleId });
    }
  }

  /**
   * Update message status
   */
  updateMessageStatus(messageId, status) {
    if (this.socket && this.isConnected) {
      this.socket.emit("message_status", {
        messageId,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update agent status
   */
  updateAgentStatus(status, currentTickets = 0, maxTickets = 5) {
    if (this.socket && this.isConnected) {
      this.socket.emit("agent_status", {
        status,
        currentTickets,
        maxTickets,
      });
    }
  }

  /**
   * Escalate chat
   */
  escalateChat(chatId, moduleId, reason, priority = "medium") {
    if (this.socket && this.isConnected) {
      this.socket.emit("escalate_chat", {
        chatId,
        moduleId,
        reason,
        priority,
      });
    }
  }

  /**
   * Assign chat to agent
   */
  assignChat(chatId, agentId, moduleId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("assign_chat", {
        chatId,
        agentId,
        moduleId,
      });
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
