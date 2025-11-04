const fs = require("fs");
const path = require("path");
const Module = require("../db/models/Module");
const logger = require("../config/logger");
const { default: axios } = require("axios");
const nlpService = require("../services/nlp");

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.modulesPath = path.join(__dirname);
  }

  /**
   * Initialize module registry
   */
  async initialize() {
    try {
      logger.info("Initializing module registry...");

      // Load modules from filesystem
      await this.loadModulesFromFilesystem();

      // Sync with database
      await this.syncWithDatabase();

      logger.info(
        `Module registry initialized with ${this.modules.size} modules`
      );
    } catch (error) {
      logger.error("Failed to initialize module registry", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load modules from filesystem
   */
  async loadModulesFromFilesystem() {
    try {
      const moduleDirs = fs
        .readdirSync(this.modulesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleDir of moduleDirs) {
        if (moduleDir === "registry.js") continue; // Skip registry file

        const modulePath = path.join(this.modulesPath, moduleDir);
        const manifestPath = path.join(modulePath, "manifest.js");

        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = require(manifestPath);
            const module = await this.loadModule(
              moduleDir,
              manifest,
              modulePath
            );
            this.modules.set(moduleDir, module);
            logger.info(`Loaded module: ${moduleDir}`);
          } catch (error) {
            logger.error(`Failed to load module ${moduleDir}`, {
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Failed to load modules from filesystem", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load individual module
   */
  async loadModule(moduleId, manifest, modulePath) {
    const functions = new Map();

    // Load functions
    const functionsPath = path.join(modulePath, "functions");
    if (fs.existsSync(functionsPath)) {
      const functionFiles = fs
        .readdirSync(functionsPath)
        .filter((file) => file.endsWith(".js"))
        .map((file) => file.replace(".js", ""));

      for (const functionName of functionFiles) {
        try {
          const functionPath = path.join(functionsPath, `${functionName}.js`);
          const functionModule = require(functionPath);
          functions.set(functionName, functionModule);
        } catch (error) {
          logger.error(
            `Failed to load function ${functionName} for module ${moduleId}`,
            { error: error.message }
          );
        }
      }
    }

    return {
      id: moduleId,
      manifest,
      functions,
      path: modulePath,
      loadedAt: new Date(),
    };
  }

  /**
   * Sync modules with database
   */
  async syncWithDatabase() {
    try {
      for (const [moduleId, module] of this.modules) {
        const existingModule = await Module.findOne({ id: moduleId });

        if (existingModule) {
          // Update existing module
          existingModule.name = module.manifest.name;
          existingModule.description = module.manifest.description;
          existingModule.icon = module.manifest.icon || "🏢";
          existingModule.functions = module.manifest.functions || [];
          existingModule.welcomeMessage = module.manifest.welcomeMessage;
          existingModule.exitMessage = module.manifest.exitMessage;
          existingModule.config = module.manifest.config || {};
          existingModule.isActive = true;

          await existingModule.save();
          logger.info(`Updated module in database: ${moduleId}`);
        } else {
          // Create new module
          const newModule = new Module({
            id: moduleId,
            name: module.manifest.name,
            description: module.manifest.description,
            icon: module.manifest.icon || "🏢",
            functions: module.manifest.functions || [],
            welcomeMessage: module.manifest.welcomeMessage,
            exitMessage: module.manifest.exitMessage,
            config: module.manifest.config || {},
            isActive: true,
          });

          await newModule.save();
          logger.info(`Created new module in database: ${moduleId}`);
        }
      }
    } catch (error) {
      logger.error("Failed to sync modules with database", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get module by ID
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  /**
   * Get all modules
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Get active modules
   */
  async getActiveModules() {
    try {
      const activeModules = await Module.find({ isActive: true })
        .select("id name description icon welcomeMessage exitMessage functions")
        .sort({ name: 1 });

      return activeModules;
    } catch (error) {
      logger.error("Failed to get active modules", { error: error.message });
      return [];
    }
  }

  /**
   * Execute module function
   */
  async executeFunction(
    moduleId,
    functionName,
    parameters,
    context = {},
    message
  ) {
    try {
      // Handle global escalation function
      if (functionName.toLowerCase() === "escalate_to_human") {
        return await this.handleEscalation(
          moduleId,
          parameters,
          context,
          message
        );
      }

      const module = this.getModule(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      const functionManifest = module?.manifest?.functions?.find(
        (f) => f?.name?.toLowerCase() === functionName?.toLowerCase()
      );

      const apiInfo = functionManifest?.apiInfo ?? null;

      if (!apiInfo) {
        throw new Error(
          `Function ${functionName} not found in module ${moduleId}`
        );
      }

      const url = apiInfo?.url ?? null;
      const method = apiInfo?.method ?? null;
      const headers = apiInfo?.headers ?? null;
      const body = apiInfo?.body ?? null;

      const bodyParams = {};

      Object.keys(body).forEach((key) => {
        bodyParams[key] = parameters[key];
      });

      let response = null;

      if (method?.toLowerCase() === "get") {
        response = await axios.get(url, { params: bodyParams, headers });
      } else if (method?.toLowerCase() === "post") {
        response = await axios.post(url, bodyParams, { headers });
      } else if (method?.toLowerCase() === "put") {
        response = await axios.put(url, bodyParams, {
          headers,
        });
      }

      let responseText = null;

      // using ai to generate response text
      try {
        if (response?.data?.data) {
          const apiResponseData = response.data.data;
          const functionDescription =
            functionManifest?.description || functionName;

          // Build prompt for AI to generate WhatsApp message
          const prompt = `You are a helpful WhatsApp assistant. Generate a friendly, conversational message for the user based on the following information:

User's original request: "${message}"
Function: ${functionDescription}
API Response Data: ${JSON.stringify(apiResponseData, null, 2)}

Instructions:
- Generate a clear, friendly WhatsApp message that presents the information from the API response
- Keep it concise and conversational (WhatsApp messages should be easy to read)
- Use appropriate emojis if it makes the message friendlier
- If the response contains order tracking information, present it in a clear format
- If the response contains error information, communicate it empathetically
- Write in a natural, human-like tone
- Don't mention technical details like API calls or function names
- Focus on the actual information the user needs

Generate only the message text, nothing else.`;

          responseText = await nlpService.generateResponse(
            prompt,
            {
              moduleId,
              functionName,
              functionDescription,
              apiResponseData,
            },
            []
          );
        } else {
          // Fallback if no API response data
          responseText = await nlpService.generateResponse(
            `Generate a friendly WhatsApp message confirming that the request "${message}" has been processed successfully for the function: ${functionManifest?.description || functionName}. Keep it brief and conversational.`,
            { moduleId, functionName },
            []
          );
        }
      } catch (error) {
        logger.error("Failed to generate AI response text", {
          error: error.message,
          moduleId,
          functionName,
        });
        // Fallback response if AI generation fails
        if (response?.data?.data) {
          responseText = `I've processed your request. ${JSON.stringify(response.data.data)}`;
        } else {
          responseText = "Your request has been processed successfully.";
        }
      }

      return {
        success: true,
        result: response?.data?.data,
        response: responseText,
        functionName,
        moduleId,
      };
    } catch (error) {
      logger.error(
        `Failed to execute function ${functionName} in module ${moduleId}`,
        {
          error: error.message,
          parameters,
        }
      );

      return {
        success: false,
        error: error.message,
        functionName,
        moduleId,
      };
    }
  }

  /**
   * Handle escalation to human agent
   */
  async handleEscalation(moduleId, parameters, context = {}, message) {
    try {
      const Ticket = require("../db/models/Ticket");
      const Chat = require("../db/models/Chat");
      const { wsHub } = require("../services/wsHub");

      const { userPhone, reason } = parameters;
      const phone = userPhone || context.userPhone;

      if (!phone) {
        throw new Error("User phone number is required for escalation");
      }

      // Check if ticket already exists
      const existingTicket = await Ticket.findOne({
        userPhone: phone,
        moduleId: moduleId,
        status: { $in: ["open", "assigned", "in_progress"] },
      });

      if (existingTicket) {
        return {
          success: true,
          response:
            "A support ticket has already been created. An agent will be with you shortly.",
          functionName: "escalate_to_human",
          ticketId: existingTicket._id,
        };
      }

      // Create chat record for the escalation request
      const chat = new Chat({
        userPhone: phone,
        moduleId: moduleId,
        sessionId: context.sessionId || null,
        message: message || reason || "User requested human support",
        senderType: "user",
        messageType: "text",
        language: context.detectedLanguage || "en",
        status: "completed",
      });

      await chat.save();

      // Create new ticket
      const ticket = new Ticket({
        chatId: chat._id,
        moduleId: moduleId,
        userPhone: phone,
        sessionId: context.sessionId || null,
        title: `Human Support Request - ${phone}`,
        description:
          reason || message || "User requested to speak with a human agent",
        priority: "medium",
        category: "escalation",
        status: "open",
      });

      await ticket.save();

      // Link chat to ticket
      chat.ticketId = ticket._id;
      await chat.save();

      // Notify agents via WebSocket
      wsHub.emitToAll("new_ticket", {
        ticketId: ticket._id,
        ticket: ticket,
      });

      logger.info("Ticket created via AI escalation", {
        ticketId: ticket._id,
        userPhone: phone,
        moduleId: moduleId,
      });

      return {
        success: true,
        response:
          "I understand you'd like to speak with a human agent. I've created a support ticket and an agent will be with you shortly. Please wait for their response.",
        functionName: "escalate_to_human",
        ticketId: ticket._id,
        result: {
          ticketId: ticket._id,
          status: "open",
        },
      };
    } catch (error) {
      logger.error("Failed to handle escalation", {
        error: error.message,
        moduleId,
        parameters,
      });

      return {
        success: false,
        error: error.message,
        response:
          "I apologize, but I'm having trouble creating a support ticket right now. Please try again.",
      };
    }
  }

  /**
   * Get available functions for module
   */
  getModuleFunctions(moduleId) {
    const module = this.getModule(moduleId);
    if (!module) {
      return [];
    }

    // Always include the global escalation function
    const escalationFunction = {
      name: "escalate_to_human",
      description:
        "Escalate the conversation to a human agent when the user requests human help, wants to speak with a person, or needs assistance beyond AI capabilities",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description:
              "The reason for escalation (what the user needs help with)",
          },
          userPhone: {
            type: "string",
            description: "User's phone number",
          },
        },
        required: ["reason"],
      },
      examples: [
        "User: I want to talk to a human",
        "User: Can I speak with someone?",
        "User: I need help from a real person",
      ],
    };

    const moduleFunctions = module.manifest.functions || [];
    return [escalationFunction, ...moduleFunctions];
  }

  /**
   * Validate module function
   */
  validateFunction(moduleId, functionName, parameters) {
    // Handle global escalation function
    if (functionName.toLowerCase() === "escalate_to_human") {
      // Validate reason parameter
      if (!parameters.reason) {
        return {
          valid: false,
          error: "Missing required parameter: reason",
        };
      }
      return { valid: true };
    }

    const module = this.getModule(moduleId);
    if (!module) {
      return { valid: false, error: "Module not found" };
    }

    const functionDef = module.manifest.functions?.find(
      (f) => f.name === functionName
    );
    if (!functionDef) {
      return { valid: false, error: "Function not found" };
    }

    // Basic parameter validation
    if (functionDef.required && functionDef.required.length > 0) {
      for (const requiredParam of functionDef.required) {
        if (!(requiredParam in parameters)) {
          return {
            valid: false,
            error: `Missing required parameter: ${requiredParam}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Reload module
   */
  async reloadModule(moduleId) {
    try {
      const modulePath = path.join(this.modulesPath, moduleId);
      const manifestPath = path.join(modulePath, "manifest.js");

      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Clear require cache
      delete require.cache[require.resolve(manifestPath)];

      const manifest = require(manifestPath);
      const module = await this.loadModule(moduleId, manifest, modulePath);
      this.modules.set(moduleId, module);

      // Update database
      await this.syncWithDatabase();

      logger.info(`Reloaded module: ${moduleId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to reload module ${moduleId}`, {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get module statistics
   */
  async getModuleStats(moduleId) {
    try {
      const module = await Module.findOne({ id: moduleId });
      if (!module) {
        return null;
      }

      return {
        id: module.id,
        name: module.name,
        stats: module.stats,
        isActive: module.isActive,
        functionCount: module.functions.length,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      };
    } catch (error) {
      logger.error(`Failed to get stats for module ${moduleId}`, {
        error: error.message,
      });
      return null;
    }
  }
}

// Create singleton instance
const moduleRegistry = new ModuleRegistry();

// Initialize function
const initializeModules = async () => {
  await moduleRegistry.initialize();
};

module.exports = {
  moduleRegistry,
  initializeModules,
};
