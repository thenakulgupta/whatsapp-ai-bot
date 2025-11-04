const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticate, authorizeModule } = require("../middleware/auth");
const Chat = require("../db/models/Chat");
const Ticket = require("../db/models/Ticket");
const logger = require("../config/logger");

/**
 * Get chats with filtering
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      moduleId,
      status,
      limit = 50,
      skip = 0,
      sort = "recent",
      userPhone,
    } = req.query;

    // Build query
    const query = {};

    if (moduleId) {
      query.moduleId = moduleId;
    }

    if (status) {
      query.status = status;
    }

    if (userPhone) {
      query.userPhone = userPhone;
    }

    // Build sort
    let sortObj = { createdAt: -1 };
    if (sort === "oldest") {
      sortObj = { createdAt: 1 };
    } else if (sort === "status") {
      sortObj = { status: 1, createdAt: -1 };
    }

    const chats = await Chat.find(query)
      .sort(sortObj)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("sessionId", "activeModule contextData")
      .populate("escalatedTo", "name email")
      .populate("ticketId");

    const total = await Chat.countDocuments(query);

    res.json({
      chats,
      total,
      page: Math.floor(skip / limit),
      limit: parseInt(limit),
      hasMore: skip + chats.length < total,
    });
  } catch (error) {
    logger.error("Failed to fetch chats", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

/**
 * Get chat by ID
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("sessionId", "activeModule contextData")
      .populate("escalatedTo", "name email")
      .populate("ticketId");

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (error) {
    logger.error("Failed to fetch chat", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

/**
 * Get chat history for a user
 */
router.get("/:userId/history", authenticate, async (req, res) => {
  try {
    const { moduleId, limit = 50 } = req.query;

    const query = { userPhone: req.params.userId };
    if (moduleId) {
      query.moduleId = moduleId;
    }

    const chats = await Chat.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("sessionId", "activeModule contextData");

    res.json({ messages: chats });
  } catch (error) {
    logger.error("Failed to fetch chat history", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

/**
 * Update chat status
 */
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["pending", "processing", "completed", "failed", "escalated"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await chat.markAsCompleted(null, null);
    chat.status = status;
    await chat.save();

    res.json(chat);
  } catch (error) {
    logger.error("Failed to update chat status", { error: error.message });
    res.status(500).json({ error: "Failed to update chat status" });
  }
});

/**
 * Escalate chat to human agent
 */
router.post("/:id/escalate", authenticate, async (req, res) => {
  try {
    const { reason, priority = "medium" } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Escalation reason is required" });
    }

    // Validate chat ID parameter
    const chatId = req.params.id;
    if (
      !chatId ||
      chatId === "undefined" ||
      chatId === "null" ||
      !mongoose.Types.ObjectId.isValid(chatId)
    ) {
      return res.status(400).json({ error: "Valid chat ID is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.isEscalated) {
      return res.status(400).json({ error: "Chat is already escalated" });
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

    // Create ticket
    const ticket = new Ticket({
      chatId: chat._id,
      moduleId: chat.moduleId,
      userPhone: chat.userPhone,
      sessionId: chat.sessionId,
      title: `Escalated Chat - ${chat.userPhone}`,
      description: `Chat escalated: ${reason}`,
      priority,
      category: "chat_escalation",
      status: "open",
    });

    await ticket.save();

    // Update chat
    await chat.escalate(req.agent._id);
    chat.ticketId = ticket._id;
    await chat.save();

    logger.info("Chat escalated", {
      chatId: chat._id,
      agentId: req.agent._id,
      ticketId: ticket._id,
      reason,
    });

    res.json({
      chatId: chat._id,
      ticketId: ticket._id,
      escalatedAt: chat.escalatedAt,
    });
  } catch (error) {
    logger.error("Failed to escalate chat", { error: error.message });
    res.status(500).json({ error: "Failed to escalate chat" });
  }
});

/**
 * Get chat analytics
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

    const analytics = await Chat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          completedChats: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          escalatedChats: {
            $sum: { $cond: ["$isEscalated", 1, 0] },
          },
          averageResponseTime: { $avg: "$responseTime" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
      {
        $project: {
          _id: 0,
          totalChats: 1,
          activeChats: 1,
          completedChats: 1,
          escalatedChats: 1,
          averageResponseTime: { $round: ["$averageResponseTime", 2] },
          uniqueUsers: { $size: "$uniqueUsers" },
          escalationRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$escalatedChats", "$totalChats"] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    res.json(
      analytics[0] || {
        totalChats: 0,
        activeChats: 0,
        completedChats: 0,
        escalatedChats: 0,
        averageResponseTime: 0,
        uniqueUsers: 0,
        escalationRate: 0,
      }
    );
  } catch (error) {
    logger.error("Failed to fetch chat analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chat analytics" });
  }
});

/**
 * Get chat trends
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

    const trends = await Chat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          chats: { $sum: 1 },
          escalated: {
            $sum: { $cond: ["$isEscalated", 1, 0] },
          },
          avgResponseTime: { $avg: "$responseTime" },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          chats: 1,
          escalated: 1,
          avgResponseTime: { $round: ["$avgResponseTime", 2] },
        },
      },
    ]);

    res.json({ trends });
  } catch (error) {
    logger.error("Failed to fetch chat trends", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chat trends" });
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
