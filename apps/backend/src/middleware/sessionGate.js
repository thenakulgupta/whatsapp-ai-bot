const Session = require("../db/models/Session");
const Module = require("../db/models/Module");
const UserModule = require("../db/models/UserModule");
const config = require("../config/env");
const logger = require("../config/logger");

class SessionManager {
  constructor() {
    this.expiryHours = config.session.expiryHours;
  }

  /**
   * Get or create session for user
   */
  async getOrCreateSession(userPhone, moduleId = null) {
    try {
      // Check for existing active session
      let session = await Session.findActiveSession(userPhone);

      // If session exists but is expired, end it
      if (session && session.isExpired(this.expiryHours)) {
        logger.info("Session expired, ending session", {
          userPhone,
          sessionId: session._id,
        });
        await session.end();
        session = null;
      }

      // If no active session, create new one
      if (!session) {
        // Check if user has an active module selection
        const userModule = await UserModule.findActiveModule(userPhone);

        if (userModule) {
          // Use the user's selected module
          moduleId = userModule.activeModuleId;
        } else if (!moduleId) {
          // No module specified and no user module selection
          return { session: null, needsModuleSelection: true };
        }

        // Validate module exists and is active
        const module = await Module.findOne({ id: moduleId, isActive: true });
        if (!module) {
          logger.warn("Invalid module requested", { userPhone, moduleId });
          return {
            session: null,
            needsModuleSelection: true,
            error: "Invalid module",
          };
        }

        session = new Session({
          userPhone,
          activeModule: moduleId,
          lastMessageAt: new Date(),
        });

        await session.save();
        logger.info("New session created", {
          userPhone,
          moduleId,
          sessionId: session._id,
        });
      }

      // Update last message time
      await session.updateLastMessage();

      return { session, needsModuleSelection: false };
    } catch (error) {
      logger.error("Failed to get or create session", {
        userPhone,
        moduleId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Switch user to a different module
   */
  async switchModule(userPhone, newModuleId) {
    try {
      // Validate module exists and is active
      const module = await Module.findOne({ id: newModuleId, isActive: true });
      if (!module) {
        throw new Error("Invalid module");
      }

      // Update user's active module selection
      await UserModule.setActiveModule(userPhone, newModuleId, 24);

      // Get current session
      const currentSession = await Session.findActiveSession(userPhone);

      if (currentSession) {
        // End current session
        await currentSession.end();
      }

      // Create new session with new module
      const newSession = new Session({
        userPhone,
        activeModule: newModuleId,
        lastMessageAt: new Date(),
      });

      await newSession.save();
      logger.info("Module switched", {
        userPhone,
        newModuleId,
        sessionId: newSession._id,
      });

      return newSession;
    } catch (error) {
      logger.error("Failed to switch module", {
        userPhone,
        newModuleId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(userPhone) {
    try {
      const session = await Session.findActiveSession(userPhone);
      if (session) {
        await session.end();
        logger.info("Session ended", { userPhone, sessionId: session._id });
      }

      // Also clear the user's active module selection
      await UserModule.clearActiveModule(userPhone);

      return true;
    } catch (error) {
      logger.error("Failed to end session", {
        userPhone,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get session context
   */
  async getSessionContext(userPhone) {
    try {
      const session = await Session.findActiveSession(userPhone);
      if (!session) {
        return null;
      }

      return {
        sessionId: session._id,
        activeModule: session.activeModule,
        contextData: session.contextData,
        messageCount: session.messageCount,
        startTime: session.startTime,
        language: session.language,
      };
    } catch (error) {
      logger.error("Failed to get session context", {
        userPhone,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Update session context
   */
  async updateSessionContext(userPhone, key, value) {
    try {
      const session = await Session.findActiveSession(userPhone);
      if (session) {
        await session.addContext(key, value);
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Failed to update session context", {
        userPhone,
        key,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Clear session context
   */
  async clearSessionContext(userPhone) {
    try {
      const session = await Session.findActiveSession(userPhone);
      if (session) {
        await session.clearContext();
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Failed to clear session context", {
        userPhone,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get available modules for user
   */
  async getAvailableModules() {
    try {
      const modules = await Module.find({ isActive: true })
        .select("id name description icon welcomeMessage")
        .sort({ name: 1 });

      return modules;
    } catch (error) {
      logger.error("Failed to get available modules", { error: error.message });
      return [];
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const cleanedCount = await Session.cleanupExpiredSessions(
        this.expiryHours
      );
      if (cleanedCount > 0) {
        logger.info("Cleaned up expired sessions", { count: cleanedCount });
      }
      return cleanedCount;
    } catch (error) {
      logger.error("Failed to cleanup expired sessions", {
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(moduleId = null, startDate = null, endDate = null) {
    try {
      const matchStage = {};

      if (moduleId) {
        matchStage.activeModule = moduleId;
      }

      if (startDate && endDate) {
        matchStage.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      const stats = await Session.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: ["$isActive", 1, 0] },
            },
            averageDuration: { $avg: "$duration" },
            averageMessageCount: { $avg: "$messageCount" },
            uniqueUsers: { $addToSet: "$userPhone" },
          },
        },
        {
          $project: {
            _id: 0,
            totalSessions: 1,
            activeSessions: 1,
            averageDuration: 1,
            averageMessageCount: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
          },
        },
      ]);

      return (
        stats[0] || {
          totalSessions: 0,
          activeSessions: 0,
          averageDuration: 0,
          averageMessageCount: 0,
          uniqueUsers: 0,
        }
      );
    } catch (error) {
      logger.error("Failed to get session stats", { error: error.message });
      return {
        totalSessions: 0,
        activeSessions: 0,
        averageDuration: 0,
        averageMessageCount: 0,
        uniqueUsers: 0,
      };
    }
  }
}

// Middleware function for session management
const sessionGate = async (req, res, next) => {
  try {
    const { userPhone, moduleId } = req.body;

    if (!userPhone) {
      return res.status(400).json({ error: "User phone number is required" });
    }

    const sessionManager = new SessionManager();
    const { session, needsModuleSelection, error } =
      await sessionManager.getOrCreateSession(userPhone, moduleId);

    req.sessionManager = sessionManager;
    req.session = session;
    req.needsModuleSelection = needsModuleSelection;
    req.sessionError = error;

    next();
  } catch (error) {
    logger.error("Session gate middleware error", { error: error.message });
    res.status(500).json({ error: "Session management failed" });
  }
};

module.exports = { SessionManager, sessionGate };
