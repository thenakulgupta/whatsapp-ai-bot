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
    // In development or HTTP, use the configured backend URL
    const backendUrl = "https://whatsapp-ai-bot-backend-projects.nakulgupta.in/api"
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
      toast(`Chat escalated: ${data.chatId}`, { icon: "📢" });
    });

    // Ticket updates
    this.socket.on("new_ticket", (data) => {
      console.log("📥 WebSocket received: new_ticket", data);
      this.emit("new_ticket", data);
      toast.success(`New ticket created!`);
    });

    this.socket.on("ticket_updated", (data) => {
      console.log("📥 WebSocket received: ticket_updated", data);
      this.emit("ticket_updated", data);
    });

    this.socket.on("ticket_assigned", (data) => {
      console.log("📥 WebSocket received: ticket_assigned", data);
      this.emit("ticket_assigned", data);
      toast.success(`Ticket assigned!`);
    });

    // Agent updates
    this.socket.on("agent_online", (data) => {
      this.emit("agent_online", data);
    });

    this.socket.on("agent_offline", (data) => {
      this.emit("agent_offline", data);
    });

    // Message updates
    this.socket.on("new_message", (data) => {
      this.emit("new_message", data);
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
    console.log(`📝 Registering listener for event: ${event}`, {
      callbackName: callback.name || "anonymous",
      existingListeners: this.listeners.get(event)?.size || 0,
    });

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    console.log(
      `✅ Listener registered for ${event}. Total listeners:`,
      this.listeners.get(event).size
    );
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
    console.log(`📢 Emitting event to listeners: ${event}`, {
      hasListeners: this.listeners.has(event),
      listenerCount: this.listeners.get(event)?.size || 0,
    });

    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      console.log(`🎯 Executing ${listeners.size} callback(s) for ${event}`);

      let callbackIndex = 0;
      listeners.forEach((callback) => {
        try {
          console.log(`🔵 Calling callback #${callbackIndex} for ${event}`, {
            callbackName: callback.name || "anonymous",
            callbackType: typeof callback,
          });
          const result = callback(data);
          console.log(
            `✅ Callback #${callbackIndex} executed successfully, result:`,
            result
          );
          callbackIndex++;
        } catch (error) {
          console.error(
            `❌ Error in callback #${callbackIndex} for ${event}:`,
            error
          );
          console.error("Error stack:", error.stack);
          callbackIndex++;
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for event: ${event}`);
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
