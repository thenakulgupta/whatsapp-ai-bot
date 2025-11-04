const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticate, authorizeModule } = require("../middleware/auth");
const Ticket = require("../db/models/Ticket");
const Agent = require("../db/models/Agent");
const logger = require("../config/logger");

/**
 * Get tickets with filtering
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      moduleId,
      status,
      priority,
      assignedTo,
      limit = 50,
      skip = 0,
      sort = "recent",
    } = req.query;

    // Build query
    const query = {};

    if (moduleId) {
      query.moduleId = moduleId;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Build sort
    let sortObj = { createdAt: -1 };
    if (sort === "oldest") {
      sortObj = { createdAt: 1 };
    } else if (sort === "priority") {
      sortObj = { priority: 1, createdAt: -1 };
    } else if (sort === "status") {
      sortObj = { status: 1, createdAt: -1 };
    }

    const tickets = await Ticket.find(query)
      .sort(sortObj)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("assignedTo", "name email")
      .populate("chatId", "message senderType")
      .populate("sessionId", "userPhone activeModule");

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      total,
      page: Math.floor(skip / limit),
      limit: parseInt(limit),
      hasMore: skip + tickets.length < total,
    });
  } catch (error) {
    logger.error("Failed to fetch tickets", { error: error.message });
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

/**
 * Get ticket by ID
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("chatId", "message senderType")
      .populate("sessionId", "userPhone activeModule")
      .populate("notes.author", "name email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    logger.error("Failed to fetch ticket", { error: error.message });
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

/**
 * Assign ticket to agent
 */
router.post("/:id/assign", authenticate, async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    // Validate ticket ID parameter
    const ticketId = req.params.id;
    if (
      !ticketId ||
      ticketId === "undefined" ||
      ticketId === "null" ||
      !mongoose.Types.ObjectId.isValid(ticketId)
    ) {
      return res.status(400).json({ error: "Valid ticket ID is required" });
    }

    // Validate agent ID
    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Valid agent ID is required" });
    }

    // Validate agent exists and has valid ID
    if (
      !req.agent ||
      !req.agent._id ||
      !mongoose.Types.ObjectId.isValid(req.agent._id)
    ) {
      return res
        .status(401)
        .json({ error: "Valid agent authentication required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (!agent.canTakeTicket()) {
      let errorMessage = "Agent cannot take tickets";
      if (!agent.isActive) {
        errorMessage = "Agent is not active";
      } else if (!agent.isOnline) {
        errorMessage = "Agent is offline";
      }
      return res.status(400).json({
        error: errorMessage,
        agentId: agent._id,
        currentTickets: agent.currentTickets.length,
        maxTickets: agent.maxConcurrentTickets,
        isActive: agent.isActive,
        isOnline: agent.isOnline,
      });
    }

    await ticket.assign(agentId);
    await agent.assignTicket(ticket._id);

    logger.info("Ticket assigned", {
      ticketId: ticket._id,
      agentId,
      assignedBy: req.agent._id,
    });

    res.json({
      ticketId: ticket._id,
      assignedTo: agentId,
      assignedAt: ticket.assignedAt,
    });
  } catch (error) {
    logger.error("Failed to assign ticket", { error: error.message });
    res.status(500).json({ error: "Failed to assign ticket" });
  }
});

/**
 * Update ticket
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.id;

    Object.assign(ticket, updates);
    await ticket.save();

    logger.info("Ticket updated", {
      ticketId: ticket._id,
      updatedBy: req.agent._id,
      updates: Object.keys(updates),
    });

    res.json(ticket);
  } catch (error) {
    logger.error("Failed to update ticket", { error: error.message });
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

/**
 * Start working on ticket
 */
router.post("/:id/start", authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if ticket is assigned before checking authorization
    if (!ticket.assignedTo) {
      return res
        .status(400)
        .json({ error: "Ticket must be assigned before it can be started" });
    }

    if (ticket.assignedTo.toString() !== req.agent._id.toString()) {
      return res
        .status(403)
        .json({ error: "You can only start tickets assigned to you" });
    }

    await ticket.startProgress();

    logger.info("Ticket started", {
      ticketId: ticket._id,
      agentId: req.agent._id,
    });

    res.json(ticket);
  } catch (error) {
    logger.error("Failed to start ticket", { error: error.message });
    res.status(500).json({ error: "Failed to start ticket" });
  }
});

/**
 * Resolve ticket
 */
router.post("/:id/resolve", authenticate, async (req, res) => {
  try {
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: "Resolution is required" });
    }

    // Validate ticket ID parameter
    const ticketId = req.params.id;
    if (
      !ticketId ||
      ticketId === "undefined" ||
      ticketId === "null" ||
      !mongoose.Types.ObjectId.isValid(ticketId)
    ) {
      return res.status(400).json({ error: "Valid ticket ID is required" });
    }

    // Validate agent exists and has valid ID
    if (
      !req.agent ||
      !req.agent._id ||
      !mongoose.Types.ObjectId.isValid(req.agent._id)
    ) {
      return res
        .status(401)
        .json({ error: "Valid agent authentication required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if ticket is assigned before checking authorization
    if (!ticket.assignedTo) {
      return res
        .status(400)
        .json({ error: "Ticket must be assigned before it can be resolved" });
    }

    if (ticket.assignedTo.toString() !== req.agent._id.toString()) {
      return res
        .status(403)
        .json({ error: "You can only resolve tickets assigned to you" });
    }

    await ticket.resolve(resolution);

    logger.info("Ticket resolved", {
      ticketId: ticket._id,
      agentId: req.agent._id,
      resolution: resolution.substring(0, 100),
    });

    res.json({
      ticketId: ticket._id,
      resolvedAt: ticket.resolvedAt,
      resolution: ticket.resolution,
    });
  } catch (error) {
    logger.error("Failed to resolve ticket", { error: error.message });
    res.status(500).json({ error: "Failed to resolve ticket" });
  }
});

/**
 * Close ticket
 */
router.post("/:id/close", authenticate, async (req, res) => {
  try {
    // Validate ticket ID parameter
    const ticketId = req.params.id;
    if (
      !ticketId ||
      ticketId === "undefined" ||
      ticketId === "null" ||
      !mongoose.Types.ObjectId.isValid(ticketId)
    ) {
      return res.status(400).json({ error: "Valid ticket ID is required" });
    }

    // Validate agent exists and has valid ID
    if (
      !req.agent ||
      !req.agent._id ||
      !mongoose.Types.ObjectId.isValid(req.agent._id)
    ) {
      return res
        .status(401)
        .json({ error: "Valid agent authentication required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check authorization: allow if admin, or if ticket is assigned to the agent, or if ticket is unassigned
    if (
      ticket.assignedTo &&
      ticket.assignedTo.toString() !== req.agent._id.toString() &&
      req.agent.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "You can only close tickets assigned to you" });
    }

    await ticket.close();

    logger.info("Ticket closed", {
      ticketId: ticket._id,
      agentId: req.agent._id,
    });

    res.json({
      ticketId: ticket._id,
      closedAt: ticket.closedAt,
    });
  } catch (error) {
    logger.error("Failed to close ticket", { error: error.message });
    res.status(500).json({ error: "Failed to close ticket" });
  }
});

/**
 * Add note to ticket
 */
router.post("/:id/notes", authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    await ticket.addNote(content, req.agent._id);

    logger.info("Note added to ticket", {
      ticketId: ticket._id,
      agentId: req.agent._id,
    });

    res.json({
      ticketId: ticket._id,
      note: {
        content,
        author: req.agent._id,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to add note to ticket", { error: error.message });
    res.status(500).json({ error: "Failed to add note to ticket" });
  }
});

/**
 * Escalate ticket
 */
router.post("/:id/escalate", authenticate, async (req, res) => {
  try {
    const { agentId, level } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID is required" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    await ticket.escalate(agentId, level);

    logger.info("Ticket escalated", {
      ticketId: ticket._id,
      fromAgent: req.agent._id,
      toAgent: agentId,
      level,
    });

    res.json({
      ticketId: ticket._id,
      escalatedTo: agentId,
      escalatedAt: ticket.escalatedAt,
      escalationLevel: ticket.escalationLevel,
    });
  } catch (error) {
    logger.error("Failed to escalate ticket", { error: error.message });
    res.status(500).json({ error: "Failed to escalate ticket" });
  }
});

/**
 * Get ticket analytics
 */
router.get("/analytics/overview", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      createdAt: { $gte: startDate },
    };

    if (moduleId) {
      matchStage.moduleId = moduleId;
    }

    const analytics = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          assignedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          averageResolutionTime: { $avg: "$resolutionTime" },
          averageResponseTime: { $avg: "$responseTime" },
          averageSatisfaction: { $avg: "$customerSatisfaction.rating" },
        },
      },
      {
        $project: {
          _id: 0,
          totalTickets: 1,
          openTickets: 1,
          assignedTickets: 1,
          inProgressTickets: 1,
          resolvedTickets: 1,
          closedTickets: 1,
          averageResolutionTime: { $round: ["$averageResolutionTime", 2] },
          averageResponseTime: { $round: ["$averageResponseTime", 2] },
          averageSatisfaction: { $round: ["$averageSatisfaction", 2] },
        },
      },
    ]);

    res.json(
      analytics[0] || {
        totalTickets: 0,
        openTickets: 0,
        assignedTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        averageResolutionTime: 0,
        averageResponseTime: 0,
        averageSatisfaction: 0,
      }
    );
  } catch (error) {
    logger.error("Failed to fetch ticket analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch ticket analytics" });
  }
});

/**
 * Get ticket trends
 */
router.get("/analytics/trends", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      createdAt: { $gte: startDate },
    };

    if (moduleId) {
      matchStage.moduleId = moduleId;
    }

    const trends = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          open: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          avgResolutionTime: { $avg: "$resolutionTime" },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          open: 1,
          resolved: 1,
          closed: 1,
          avgResolutionTime: { $round: ["$avgResolutionTime", 2] },
        },
      },
    ]);

    res.json({ trends });
  } catch (error) {
    logger.error("Failed to fetch ticket trends", { error: error.message });
    res.status(500).json({ error: "Failed to fetch ticket trends" });
  }
});

/**
 * Get chat history for a ticket
 */
router.get("/:id/messages", authenticate, async (req, res) => {
  try {
    const Chat = require("../db/models/Chat");
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Get only messages from when the ticket was created onwards
    // This shows only the conversation during the escalated/ticket period
    const messages = await Chat.find({
      userPhone: ticket.userPhone,
      moduleId: ticket.moduleId,
      createdAt: { $gte: ticket.createdAt }, // Only messages after ticket creation
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("escalatedTo", "name email");

    res.json({ messages });
  } catch (error) {
    logger.error("Failed to fetch ticket messages", { error: error.message });
    res.status(500).json({ error: "Failed to fetch ticket messages" });
  }
});

/**
 * Send message to user (from agent)
 */
router.post("/:id/messages", authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const Chat = require("../db/models/Chat");
    const whatsappService = require("../services/whatsapp");
    const { wsHub } = require("../services/wsHub");

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if ticket is assigned - agents can only message if ticket is assigned
    if (!ticket.assignedTo) {
      return res.status(403).json({
        error:
          "Ticket must be assigned before you can send messages. Please assign the ticket first.",
      });
    }

    // Check if ticket is assigned to this agent (or if agent is admin)
    if (
      ticket.assignedTo.toString() !== req.agent._id.toString() &&
      req.agent.role !== "admin"
    ) {
      return res.status(403).json({
        error: "You can only send messages to tickets assigned to you",
      });
    }

    // Create chat record for agent message
    const chat = new Chat({
      userPhone: ticket.userPhone,
      moduleId: ticket.moduleId,
      sessionId: ticket.sessionId,
      message: message,
      senderType: "human",
      messageType: "text",
      status: "completed",
      ticketId: ticket._id,
    });

    await chat.save();

    // Send message via WhatsApp
    try {
      await whatsappService.sendTextMessage(ticket.userPhone, message);

      logger.info("Agent message sent to user", {
        ticketId: ticket._id,
        agentId: req.agent._id,
        userPhone: ticket.userPhone,
      });

      // Emit WebSocket event for real-time updates
      wsHub.emitToAll("new_message", {
        ticketId: ticket._id,
        message: chat,
      });

      res.json({
        success: true,
        message: "Message sent successfully",
        chat,
      });
    } catch (whatsappError) {
      logger.error("Failed to send WhatsApp message", {
        error: whatsappError.message,
        ticketId: ticket._id,
      });

      // Mark chat as failed
      await chat.markAsFailed(whatsappError);

      res.status(500).json({
        error: "Failed to send message via WhatsApp",
        details: whatsappError.message,
      });
    }
  } catch (error) {
    logger.error("Failed to send message", { error: error.message });
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * Helper function to get start date based on period
 */
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

module.exports = router;
