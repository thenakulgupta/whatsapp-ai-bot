const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Chat = require("../db/models/Chat");
const Ticket = require("../db/models/Ticket");
const Session = require("../db/models/Session");
const Agent = require("../db/models/Agent");
const Module = require("../db/models/Module");
const logger = require("../config/logger");

/**
 * Get overall analytics
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      createdAt: { $gte: startDate },
    };

    if (moduleId) {
      matchStage.moduleId = moduleId;
    }

    // Get chat analytics
    const chatAnalytics = await Chat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          escalatedChats: {
            $sum: { $cond: ["$isEscalated", 1, 0] },
          },
          averageResponseTime: { $avg: "$responseTime" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
    ]);

    // Get ticket analytics
    const ticketAnalytics = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          averageResolutionTime: { $avg: "$resolutionTime" },
        },
      },
    ]);

    // Get session analytics
    const sessionAnalytics = await Session.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          averageDuration: { $avg: "$duration" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
    ]);

    // Get agent analytics
    const agentAnalytics = await Agent.aggregate([
      {
        $group: {
          _id: null,
          totalAgents: { $sum: 1 },
          activeAgents: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          onlineAgents: {
            $sum: { $cond: ["$isOnline", 1, 0] },
          },
          averageTicketsHandled: { $avg: "$stats.totalTicketsHandled" },
          averageResponseTime: { $avg: "$stats.averageResponseTime" },
          averageSatisfaction: { $avg: "$stats.customerSatisfaction" },
        },
      },
    ]);

    const chatData = chatAnalytics[0] || {
      totalChats: 0,
      activeChats: 0,
      escalatedChats: 0,
      averageResponseTime: 0,
      uniqueUsers: [],
    };

    const ticketData = ticketAnalytics[0] || {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResolutionTime: 0,
    };

    const sessionData = sessionAnalytics[0] || {
      totalSessions: 0,
      activeSessions: 0,
      averageDuration: 0,
      uniqueUsers: [],
    };

    const agentData = agentAnalytics[0] || {
      totalAgents: 0,
      activeAgents: 0,
      onlineAgents: 0,
      averageTicketsHandled: 0,
      averageResponseTime: 0,
      averageSatisfaction: 0,
    };

    res.json({
      stats: {
        totalChats: chatData.totalChats,
        activeChats: chatData.activeChats,
        totalTickets: ticketData.totalTickets,
        openTickets: ticketData.openTickets,
        totalAgents: agentData.totalAgents,
        onlineAgents: agentData.onlineAgents,
        totalSessions: sessionData.totalSessions,
        activeSessions: sessionData.activeSessions,
        averageResponseTime: Math.round(chatData.averageResponseTime || 0),
        escalationRate:
          chatData.totalChats > 0
            ? Math.round((chatData.escalatedChats / chatData.totalChats) * 100)
            : 0,
      },
      period,
      moduleId,
    });
  } catch (error) {
    logger.error("Failed to fetch analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * Get module-specific analytics
 */
router.get("/modules/:moduleId", authenticate, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      moduleId,
      createdAt: { $gte: startDate },
    };

    // Get module stats
    const module = await Module.findOne({ id: moduleId });
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Get chat analytics for module
    const chatAnalytics = await Chat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          escalatedChats: {
            $sum: { $cond: ["$isEscalated", 1, 0] },
          },
          averageResponseTime: { $avg: "$responseTime" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
    ]);

    // Get ticket analytics for module
    const ticketAnalytics = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          averageResolutionTime: { $avg: "$resolutionTime" },
        },
      },
    ]);

    // Get session analytics for module
    const sessionAnalytics = await Session.aggregate([
      { $match: { activeModule: moduleId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
          averageDuration: { $avg: "$duration" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
    ]);

    const chatData = chatAnalytics[0] || {
      totalChats: 0,
      activeChats: 0,
      escalatedChats: 0,
      averageResponseTime: 0,
      uniqueUsers: [],
    };

    const ticketData = ticketAnalytics[0] || {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResolutionTime: 0,
    };

    const sessionData = sessionAnalytics[0] || {
      totalSessions: 0,
      activeSessions: 0,
      averageDuration: 0,
      uniqueUsers: [],
    };

    res.json({
      module: {
        id: module.id,
        name: module.name,
        description: module.description,
        icon: module.icon,
        isActive: module.isActive,
        functionCount: module.functions.length,
      },
      stats: {
        totalChats: chatData.totalChats,
        activeChats: chatData.activeChats,
        totalTickets: ticketData.totalTickets,
        openTickets: ticketData.openTickets,
        totalSessions: sessionData.totalSessions,
        activeSessions: sessionData.activeSessions,
        averageResponseTime: Math.round(chatData.averageResponseTime || 0),
        escalationRate:
          chatData.totalChats > 0
            ? Math.round((chatData.escalatedChats / chatData.totalChats) * 100)
            : 0,
      },
      period,
    });
  } catch (error) {
    logger.error("Failed to fetch module analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch module analytics" });
  }
});

/**
 * Get chat analytics
 */
router.get("/chats", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      createdAt: { $gte: startDate },
    };

    if (moduleId) {
      matchStage.moduleId = moduleId;
    }

    // Get overview
    const overview = await Chat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          escalatedChats: {
            $sum: { $cond: ["$isEscalated", 1, 0] },
          },
          averageResponseTime: { $avg: "$responseTime" },
          uniqueUsers: { $addToSet: "$userPhone" },
        },
      },
    ]);

    // Get trends
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

    // Get response time data
    const responseTimeData = await Chat.aggregate([
      { $match: { ...matchStage, responseTime: { $exists: true } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          avgResponseTime: { $avg: "$responseTime" },
          maxResponseTime: { $max: "$responseTime" },
          minResponseTime: { $min: "$responseTime" },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          avgResponseTime: { $round: ["$avgResponseTime", 2] },
          maxResponseTime: { $round: ["$maxResponseTime", 2] },
          minResponseTime: { $round: ["$minResponseTime", 2] },
        },
      },
    ]);

    const overviewData = overview[0] || {
      totalChats: 0,
      activeChats: 0,
      escalatedChats: 0,
      averageResponseTime: 0,
      uniqueUsers: [],
    };

    res.json({
      overview: overviewData,
      trends,
      responseTime: responseTimeData,
      period,
      moduleId,
    });
  } catch (error) {
    logger.error("Failed to fetch chat analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch chat analytics" });
  }
});

/**
 * Get ticket analytics
 */
router.get("/tickets", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);
    const matchStage = {
      createdAt: { $gte: startDate },
    };

    if (moduleId) {
      matchStage.moduleId = moduleId;
    }

    // Get overview
    const overview = await Ticket.aggregate([
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
    ]);

    // Get trends
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

    // Get escalation data
    const escalationData = await Ticket.aggregate([
      { $match: { ...matchStage, escalationLevel: { $gt: 1 } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          escalations: { $sum: 1 },
          avgEscalationLevel: { $avg: "$escalationLevel" },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          escalations: 1,
          avgEscalationLevel: { $round: ["$avgEscalationLevel", 2] },
        },
      },
    ]);

    const overviewData = overview[0] || {
      totalTickets: 0,
      openTickets: 0,
      assignedTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      averageResolutionTime: 0,
      averageResponseTime: 0,
      averageSatisfaction: 0,
    };

    res.json({
      overview: overviewData,
      trends,
      escalations: escalationData,
      period,
      moduleId,
    });
  } catch (error) {
    logger.error("Failed to fetch ticket analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch ticket analytics" });
  }
});

/**
 * Get agent analytics
 */
router.get("/agents", authenticate, async (req, res) => {
  try {
    const { moduleId, period = "7d" } = req.query;

    const startDate = getStartDate(period);

    // Get agent performance
    const performance = await Agent.aggregate([
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "assignedTo",
          as: "tickets",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "escalatedTo",
          as: "escalatedChats",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          isOnline: 1,
          isActive: 1,
          assignedModules: 1,
          currentTickets: 1,
          maxConcurrentTickets: 1,
          stats: 1,
          ticketsHandled: { $size: "$tickets" },
          chatsEscalated: { $size: "$escalatedChats" },
          workloadPercentage: {
            $multiply: [
              {
                $divide: [
                  { $size: "$currentTickets" },
                  "$maxConcurrentTickets",
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { "stats.totalTicketsHandled": -1 } },
    ]);

    // Filter by module if specified
    let filteredPerformance = performance;
    if (moduleId) {
      filteredPerformance = performance.filter((agent) =>
        agent.assignedModules.includes(moduleId)
      );
    }

    res.json({
      performance: filteredPerformance,
      period,
      moduleId,
    });
  } catch (error) {
    logger.error("Failed to fetch agent analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch agent analytics" });
  }
});

/**
 * Get module analytics
 */
router.get("/modules", authenticate, async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    const startDate = getStartDate(period);

    // Get module stats
    const moduleStats = await Module.aggregate([
      {
        $lookup: {
          from: "chats",
          localField: "id",
          foreignField: "moduleId",
          as: "chats",
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "id",
          foreignField: "moduleId",
          as: "tickets",
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "id",
          foreignField: "activeModule",
          as: "sessions",
        },
      },
      {
        $project: {
          id: 1,
          name: 1,
          description: 1,
          icon: 1,
          isActive: 1,
          functionCount: { $size: "$functions" },
          totalChats: { $size: "$chats" },
          totalTickets: { $size: "$tickets" },
          totalSessions: { $size: "$sessions" },
          activeSessions: {
            $size: {
              $filter: {
                input: "$sessions",
                cond: { $eq: ["$$this.isActive", true] },
              },
            },
          },
          escalatedChats: {
            $size: {
              $filter: {
                input: "$chats",
                cond: { $eq: ["$$this.isEscalated", true] },
              },
            },
          },
        },
      },
      { $sort: { totalChats: -1 } },
    ]);

    res.json({
      stats: moduleStats,
      period,
    });
  } catch (error) {
    logger.error("Failed to fetch module analytics", { error: error.message });
    res.status(500).json({ error: "Failed to fetch module analytics" });
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
