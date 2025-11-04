const logger = require("../config/logger");

class WebSocketHub {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.agentSockets = new Map();
  }

  /**
   * Initialize WebSocket hub
   */
  initialize(io) {
    this.io = io;

    io.on("connection", (socket) => {
      logger.info("Client connected", { socketId: socket.id });

      // Handle client authentication
      socket.on("authenticate", (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle agent authentication
      socket.on("agent_authenticate", (data) => {
        this.handleAgentAuthentication(socket, data);
      });

      // Handle module selection
      socket.on("select_module", (data) => {
        this.handleModuleSelection(socket, data);
      });

      // Handle message status updates
      socket.on("message_status", (data) => {
        this.handleMessageStatus(socket, data);
      });

      // Handle agent status updates
      socket.on("agent_status", (data) => {
        this.handleAgentStatus(socket, data);
      });

      // Handle chat escalation
      socket.on("escalate_chat", (data) => {
        this.handleChatEscalation(socket, data);
      });

      // Handle chat assignment
      socket.on("assign_chat", (data) => {
        this.handleChatAssignment(socket, data);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });

    logger.info("WebSocket hub initialized");
  }

  /**
   * Handle client authentication
   */
  handleAuthentication(socket, data) {
    try {
      const { clientId, moduleId } = data;

      if (!clientId) {
        socket.emit("error", { message: "Client ID is required" });
        return;
      }

      socket.clientId = clientId;
      socket.moduleId = moduleId;
      this.connectedClients.set(socket.id, {
        clientId,
        moduleId,
        socket,
        connectedAt: new Date(),
      });

      socket.join(`client_${clientId}`);
      if (moduleId) {
        socket.join(`module_${moduleId}`);
      }

      socket.emit("authenticated", {
        clientId,
        moduleId,
        timestamp: new Date().toISOString(),
      });

      logger.info("Client authenticated", {
        socketId: socket.id,
        clientId,
        moduleId,
      });
    } catch (error) {
      logger.error("Client authentication failed", { error: error.message });
      socket.emit("error", { message: "Authentication failed" });
    }
  }

  /**
   * Handle agent authentication
   */
  handleAgentAuthentication(socket, data) {
    try {
      const { agentId, agentRole, assignedModules } = data;

      if (!agentId) {
        socket.emit("error", { message: "Agent ID is required" });
        return;
      }

      socket.agentId = agentId;
      socket.agentRole = agentRole;
      socket.assignedModules = assignedModules || [];

      this.agentSockets.set(socket.id, {
        agentId,
        agentRole,
        assignedModules,
        socket,
        connectedAt: new Date(),
        isOnline: true,
      });

      // Join agent to relevant rooms
      socket.join(`agent_${agentId}`);
      socket.join("agents");

      if (assignedModules && assignedModules.length > 0) {
        assignedModules.forEach((moduleId) => {
          socket.join(`module_${moduleId}`);
        });
      }

      socket.emit("agent_authenticated", {
        agentId,
        agentRole,
        assignedModules,
        timestamp: new Date().toISOString(),
      });

      // Notify other agents about new agent online
      socket.to("agents").emit("agent_online", {
        agentId,
        agentRole,
        assignedModules,
        timestamp: new Date().toISOString(),
      });

      logger.info("Agent authenticated", {
        socketId: socket.id,
        agentId,
        agentRole,
      });
    } catch (error) {
      logger.error("Agent authentication failed", { error: error.message });
      socket.emit("error", { message: "Agent authentication failed" });
    }
  }

  /**
   * Handle module selection
   */
  handleModuleSelection(socket, data) {
    try {
      const { moduleId } = data;

      if (!moduleId) {
        socket.emit("error", { message: "Module ID is required" });
        return;
      }

      // Leave previous module room
      if (socket.moduleId) {
        socket.leave(`module_${socket.moduleId}`);
      }

      // Join new module room
      socket.moduleId = moduleId;
      socket.join(`module_${moduleId}`);

      // Update client info
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.moduleId = moduleId;
      }

      socket.emit("module_selected", {
        moduleId,
        timestamp: new Date().toISOString(),
      });

      logger.info("Module selected", { socketId: socket.id, moduleId });
    } catch (error) {
      logger.error("Module selection failed", { error: error.message });
      socket.emit("error", { message: "Module selection failed" });
    }
  }

  /**
   * Handle message status updates
   */
  handleMessageStatus(socket, data) {
    try {
      const { messageId, status, timestamp } = data;

      if (!messageId || !status) {
        socket.emit("error", { message: "Message ID and status are required" });
        return;
      }

      // Broadcast status update to relevant clients
      socket.to(`client_${socket.clientId}`).emit("message_status_update", {
        messageId,
        status,
        timestamp: timestamp || new Date().toISOString(),
      });

      logger.info("Message status updated", {
        messageId,
        status,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error("Message status update failed", { error: error.message });
      socket.emit("error", { message: "Message status update failed" });
    }
  }

  /**
   * Handle agent status updates
   */
  handleAgentStatus(socket, data) {
    try {
      const { status, currentTickets, maxTickets } = data;

      if (!socket.agentId) {
        socket.emit("error", { message: "Agent not authenticated" });
        return;
      }

      const agentInfo = this.agentSockets.get(socket.id);
      if (agentInfo) {
        agentInfo.status = status;
        agentInfo.currentTickets = currentTickets || 0;
        agentInfo.maxTickets = maxTickets || 5;
        agentInfo.lastStatusUpdate = new Date();
      }

      // Broadcast agent status to other agents
      socket.to("agents").emit("agent_status_update", {
        agentId: socket.agentId,
        status,
        currentTickets,
        maxTickets,
        timestamp: new Date().toISOString(),
      });

      logger.info("Agent status updated", {
        agentId: socket.agentId,
        status,
        currentTickets,
        maxTickets,
      });
    } catch (error) {
      logger.error("Agent status update failed", { error: error.message });
      socket.emit("error", { message: "Agent status update failed" });
    }
  }

  /**
   * Handle chat escalation
   */
  handleChatEscalation(socket, data) {
    try {
      const { chatId, moduleId, reason, priority } = data;

      if (!chatId || !moduleId) {
        socket.emit("error", { message: "Chat ID and Module ID are required" });
        return;
      }

      // Broadcast escalation to available agents in the module
      socket.to(`module_${moduleId}`).emit("chat_escalated", {
        chatId,
        moduleId,
        reason,
        priority: priority || "medium",
        escalatedAt: new Date().toISOString(),
      });

      logger.info("Chat escalated", { chatId, moduleId, reason, priority });
    } catch (error) {
      logger.error("Chat escalation failed", { error: error.message });
      socket.emit("error", { message: "Chat escalation failed" });
    }
  }

  /**
   * Handle chat assignment
   */
  handleChatAssignment(socket, data) {
    try {
      const { chatId, agentId, moduleId } = data;

      if (!chatId || !agentId) {
        socket.emit("error", { message: "Chat ID and Agent ID are required" });
        return;
      }

      // Notify assigned agent
      socket.to(`agent_${agentId}`).emit("chat_assigned", {
        chatId,
        agentId,
        moduleId,
        assignedAt: new Date().toISOString(),
      });

      // Notify other agents in the module
      socket.to(`module_${moduleId}`).emit("chat_assigned_to_agent", {
        chatId,
        agentId,
        moduleId,
        assignedAt: new Date().toISOString(),
      });

      logger.info("Chat assigned", { chatId, agentId, moduleId });
    } catch (error) {
      logger.error("Chat assignment failed", { error: error.message });
      socket.emit("error", { message: "Chat assignment failed" });
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(socket) {
    try {
      if (socket.agentId) {
        // Agent disconnect
        this.agentSockets.delete(socket.id);

        // Notify other agents
        socket.to("agents").emit("agent_offline", {
          agentId: socket.agentId,
          timestamp: new Date().toISOString(),
        });

        logger.info("Agent disconnected", {
          agentId: socket.agentId,
          socketId: socket.id,
        });
      } else {
        // Client disconnect
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
          this.connectedClients.delete(socket.id);
          logger.info("Client disconnected", {
            clientId: clientInfo.clientId,
            moduleId: clientInfo.moduleId,
            socketId: socket.id,
          });
        }
      }
    } catch (error) {
      logger.error("Disconnect handling failed", {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  /**
   * Broadcast message to all clients in a module
   */
  broadcastToModule(moduleId, event, data) {
    if (this.io) {
      this.io.to(`module_${moduleId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, event, data) {
    if (this.io) {
      this.io.to(`client_${clientId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send message to specific agent
   */
  sendToAgent(agentId, event, data) {
    if (this.io) {
      this.io.to(`agent_${agentId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast to all agents
   */
  broadcastToAgents(event, data) {
    if (this.io) {
      this.io.to("agents").emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get online agents count
   */
  getOnlineAgentsCount() {
    return this.agentSockets.size;
  }

  /**
   * Get agents by module
   */
  getAgentsByModule(moduleId) {
    const agents = [];
    for (const [socketId, agentInfo] of this.agentSockets) {
      if (agentInfo.assignedModules.includes(moduleId)) {
        agents.push({
          agentId: agentInfo.agentId,
          agentRole: agentInfo.agentRole,
          isOnline: agentInfo.isOnline,
          currentTickets: agentInfo.currentTickets || 0,
          maxTickets: agentInfo.maxTickets || 5,
        });
      }
    }
    return agents;
  }

  /**
   * Emit event to all connected clients and agents
   */
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Create singleton instance
const wsHub = new WebSocketHub();

// Initialize function
const initializeWebSocket = (io) => {
  wsHub.initialize(io);
};

module.exports = {
  wsHub,
  initializeWebSocket,
};
