const jwt = require("jsonwebtoken");
const Agent = require("../db/models/Agent");
const config = require("../config/env");
const logger = require("../config/logger");

/**
 * Generate JWT token for agent
 */
const generateToken = (agentId, role) => {
  return jwt.sign({ agentId, role }, config.server.jwtSecret, {
    expiresIn: "24h",
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.server.jwtSecret);
  } catch (error) {
    logger.error("Token verification failed", { error: error.message });
    return null;
  }
};

/**
 * Authentication middleware for admin routes
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Get agent details
    const agent = await Agent.findById(decoded.agentId);
    if (!agent || !agent.isActive) {
      return res.status(401).json({ error: "Agent not found or inactive" });
    }

    req.agent = agent;
    req.agentId = decoded.agentId;
    req.agentRole = decoded.role;

    next();
  } catch (error) {
    logger.error("Authentication middleware error", { error: error.message });
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Authorization middleware - check if agent has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.agent) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.agent.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

/**
 * Check if agent can access specific module
 */
const authorizeModule = (req, res, next) => {
  try {
    const { moduleId } = req.params;

    if (!req.agent) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin and supervisor can access all modules
    if (req.agent.role === "admin" || req.agent.role === "supervisor") {
      return next();
    }

    // Regular agents can only access assigned modules
    if (!req.agent.assignedModules.includes(moduleId)) {
      return res.status(403).json({ error: "Access denied to this module" });
    }

    next();
  } catch (error) {
    logger.error("Module authorization error", { error: error.message });
    res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Basic authentication for admin login
 */
const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ error: "Basic authentication required" });
    }

    const credentials = Buffer.from(
      authHeader.substring(6),
      "base64"
    ).toString();
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      return res.status(401).json({ error: "Invalid credentials format" });
    }

    // Check against admin credentials from config
    if (
      username === config.admin.username &&
      password === config.admin.password
    ) {
      req.isAdmin = true;
      return next();
    }

    // Check against agent credentials
    const agent = await Agent.findOne({ email: username, isActive: true });
    if (agent && (await agent.comparePassword(password))) {
      req.agent = agent;
      req.agentId = agent._id;
      req.agentRole = agent.role;
      return next();
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    logger.error("Basic authentication error", { error: error.message });
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting for auth endpoints
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const attempts = global.authAttempts.get(clientIp) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      error: "Too many authentication attempts",
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000),
    });
  }

  attempts.count++;
  global.authAttempts.set(clientIp, attempts);

  next();
};

/**
 * Create default admin agent if none exists
 */
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Agent.findOne({ role: "admin" });

    if (!adminExists) {
      const defaultAdmin = new Agent({
        name: "System Administrator",
        email: config.admin.username,
        password: config.admin.password,
        role: "admin",
        isActive: true,
        assignedModules: [], // Admin has access to all modules
        maxConcurrentTickets: 1000,
      });

      await defaultAdmin.save();
      logger.info("Default admin agent created", {
        email: config.admin.username,
      });
    }
  } catch (error) {
    logger.error("Failed to create default admin", { error: error.message });
  }
};

/**
 * Middleware to check if agent is online
 */
const requireOnline = (req, res, next) => {
  if (!req.agent.isOnline) {
    return res
      .status(403)
      .json({ error: "Agent must be online to perform this action" });
  }
  next();
};

/**
 * Middleware to check agent workload
 * Allow agents to handle multiple people in parallel
 * Only check if agent is online, not strict limit on concurrent tickets
 */
const checkWorkload = (req, res, next) => {
  if (!req.agent.isOnline) {
    return res.status(403).json({
      error: "Agent must be online to handle tickets",
    });
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  authorizeModule,
  basicAuth,
  authRateLimit,
  createDefaultAdmin,
  requireOnline,
  checkWorkload,
};
