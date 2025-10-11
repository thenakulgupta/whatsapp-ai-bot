const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorize,
  createDefaultAdmin,
} = require("../middleware/auth");
const { moduleRegistry } = require("../modules/registry");
const Module = require("../db/models/Module");
const Agent = require("../db/models/Agent");
const logger = require("../config/logger");

// Initialize default admin on startup
createDefaultAdmin();

/**
 * Admin authentication
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Check admin credentials
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = require("../middleware/auth").generateToken(
        "admin",
        "admin"
      );
      return res.json({
        token,
        agent: {
          _id: "admin",
          name: "System Administrator",
          email: username,
          role: "admin",
        },
      });
    }

    // Check agent credentials
    const agent = await Agent.findOne({ email: username, isActive: true });
    if (agent && (await agent.comparePassword(password))) {
      const token = require("../middleware/auth").generateToken(
        agent._id,
        agent.role
      );
      return res.json({
        token,
        agent: agent.toPublicJSON(),
      });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    logger.error("Admin login failed", { error: error.message });
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * Verify token
 */
router.get("/verify", authenticate, (req, res) => {
  res.json({
    agent: req.agent.toPublicJSON(),
  });
});

/**
 * Get all modules
 */
router.get("/modules", authenticate, async (req, res) => {
  try {
    const modules = await Module.find({ isActive: true })
      .select(
        "id name description icon welcomeMessage exitMessage functions stats isActive"
      )
      .sort({ name: 1 });

    res.json(modules);
  } catch (error) {
    logger.error("Failed to fetch modules", { error: error.message });
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

/**
 * Get module by ID
 */
router.get("/modules/:id", authenticate, async (req, res) => {
  try {
    const module = await Module.findOne({ id: req.params.id });
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(module);
  } catch (error) {
    logger.error("Failed to fetch module", { error: error.message });
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

/**
 * Create new module
 */
router.post(
  "/modules",
  authenticate,
  authorize("admin", "supervisor"),
  async (req, res) => {
    try {
      const {
        id,
        name,
        description,
        icon,
        welcomeMessage,
        exitMessage,
        functions,
        config,
      } = req.body;

      if (!id || !name || !description) {
        return res
          .status(400)
          .json({ error: "ID, name, and description are required" });
      }

      const existingModule = await Module.findOne({ id });
      if (existingModule) {
        return res
          .status(400)
          .json({ error: "Module with this ID already exists" });
      }

      const module = new Module({
        id,
        name,
        description,
        icon: icon || "🏢",
        welcomeMessage: welcomeMessage || `Welcome to ${name}!`,
        exitMessage: exitMessage || "Thank you for using our service!",
        functions: functions || [],
        config: config || {},
        isActive: true,
      });

      await module.save();
      res.status(201).json(module);
    } catch (error) {
      logger.error("Failed to create module", { error: error.message });
      res.status(500).json({ error: "Failed to create module" });
    }
  }
);

/**
 * Update module
 */
router.put(
  "/modules/:id",
  authenticate,
  authorize("admin", "supervisor"),
  async (req, res) => {
    try {
      const module = await Module.findOne({ id: req.params.id });
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const updates = req.body;
      delete updates.id; // Don't allow changing the ID
      delete updates._id;

      Object.assign(module, updates);
      await module.save();

      res.json(module);
    } catch (error) {
      logger.error("Failed to update module", { error: error.message });
      res.status(500).json({ error: "Failed to update module" });
    }
  }
);

/**
 * Delete module
 */
router.delete(
  "/modules/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const module = await Module.findOne({ id: req.params.id });
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      await Module.deleteOne({ id: req.params.id });
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete module", { error: error.message });
      res.status(500).json({ error: "Failed to delete module" });
    }
  }
);

/**
 * Get module statistics
 */
router.get("/modules/:id/stats", authenticate, async (req, res) => {
  try {
    const module = await Module.findOne({ id: req.params.id });
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({
      id: module.id,
      name: module.name,
      stats: module.stats,
      isActive: module.isActive,
      functionCount: module.functions.length,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    });
  } catch (error) {
    logger.error("Failed to fetch module stats", { error: error.message });
    res.status(500).json({ error: "Failed to fetch module stats" });
  }
});

/**
 * Get all agents
 */
router.get("/agents", authenticate, async (req, res) => {
  try {
    const agents = await Agent.find({ isActive: true })
      .select("-password")
      .sort({ name: 1 });

    res.json({ agents });
  } catch (error) {
    logger.error("Failed to fetch agents", { error: error.message });
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

/**
 * Get agent by ID
 */
router.get("/agents/:id", authenticate, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select("-password");
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json(agent);
  } catch (error) {
    logger.error("Failed to fetch agent", { error: error.message });
    res.status(500).json({ error: "Failed to fetch agent" });
  }
});

/**
 * Create new agent
 */
router.post(
  "/agents",
  authenticate,
  authorize("admin", "supervisor"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        role,
        assignedModules,
        maxConcurrentTickets,
        isActive,
      } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: "Name, email, and password are required" });
      }

      const existingAgent = await Agent.findOne({ email });
      if (existingAgent) {
        return res
          .status(400)
          .json({ error: "Agent with this email already exists" });
      }

      const agent = new Agent({
        name,
        email,
        password,
        phone,
        role: role || "agent",
        assignedModules: assignedModules || [],
        maxConcurrentTickets: maxConcurrentTickets || 5,
        isActive: isActive !== false,
      });

      await agent.save();
      res.status(201).json(agent.toPublicJSON());
    } catch (error) {
      logger.error("Failed to create agent", { error: error.message });
      res.status(500).json({ error: "Failed to create agent" });
    }
  }
);

/**
 * Update agent
 */
router.put(
  "/agents/:id",
  authenticate,
  authorize("admin", "supervisor"),
  async (req, res) => {
    try {
      const agent = await Agent.findById(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const updates = req.body;
      delete updates._id;

      // Don't update password if not provided
      if (!updates.password) {
        delete updates.password;
      }

      Object.assign(agent, updates);
      await agent.save();

      res.json(agent.toPublicJSON());
    } catch (error) {
      logger.error("Failed to update agent", { error: error.message });
      res.status(500).json({ error: "Failed to update agent" });
    }
  }
);

/**
 * Delete agent
 */
router.delete(
  "/agents/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const agent = await Agent.findById(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      await Agent.deleteOne({ _id: req.params.id });
      res.json({ message: "Agent deleted successfully" });
    } catch (error) {
      logger.error("Failed to delete agent", { error: error.message });
      res.status(500).json({ error: "Failed to delete agent" });
    }
  }
);

/**
 * Update agent status
 */
router.put("/agents/:id/status", authenticate, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    const { status } = req.body;

    if (status === "online") {
      await agent.goOnline();
    } else if (status === "offline") {
      await agent.goOffline();
    }

    res.json(agent.toPublicJSON());
  } catch (error) {
    logger.error("Failed to update agent status", { error: error.message });
    res.status(500).json({ error: "Failed to update agent status" });
  }
});

/**
 * Get agent statistics
 */
router.get("/agents/:id/stats", authenticate, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).select("-password");
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json({
      agent: agent.toPublicJSON(),
      stats: agent.stats,
      currentWorkload: agent.currentTickets.length,
      workloadPercentage:
        (agent.currentTickets.length / agent.maxConcurrentTickets) * 100,
    });
  } catch (error) {
    logger.error("Failed to fetch agent stats", { error: error.message });
    res.status(500).json({ error: "Failed to fetch agent stats" });
  }
});

module.exports = router;
