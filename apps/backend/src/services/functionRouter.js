const { moduleRegistry } = require("../modules/registry");
const nlpService = require("./nlp");
const logger = require("../config/logger");

class FunctionRouter {
  constructor() {
    this.moduleRegistry = moduleRegistry;
  }

  /**
   * Route message to appropriate module function
   */
  async routeMessage(message, moduleId, context = {}) {
    try {
      // Get available functions for the module
      const availableFunctions =
        this.moduleRegistry.getModuleFunctions(moduleId);

      if (!availableFunctions || availableFunctions.length === 0) {
        logger.warn(`No functions available for module ${moduleId}`);
        return {
          success: false,
          error: "No functions available for this module",
          response: "I apologize, but this module is not fully configured yet.",
        };
      }

      // Detect intent and extract entities
      const intentResult = await nlpService.detectIntent(
        message,
        availableFunctions,
        context
      );

      logger.info("Intent detected", {
        moduleId,
        message: message.substring(0, 50),
        intent: intentResult.intent,
        confidence: intentResult.confidence,
      });

      // If confidence is too low, ask for clarification
      if (intentResult.confidence < 0.6) {
        return {
          success: false,
          error: "Low confidence intent detection",
          response: this.generateClarificationResponse(
            availableFunctions,
            intentResult.intent
          ),
        };
      }

      // Execute the detected function
      const functionResult = await this.executeFunction(
        moduleId,
        intentResult.intent,
        intentResult.entities,
        context
      );

      return {
        success: functionResult.success,
        functionName: intentResult.intent,
        parameters: intentResult.entities,
        result: functionResult.result,
        response: functionResult.response || functionResult.result,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
      };
    } catch (error) {
      logger.error("Function routing failed", {
        moduleId,
        message: message.substring(0, 50),
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        response:
          "I encountered an error processing your request. Please try again.",
      };
    }
  }

  /**
   * Execute a specific function
   */
  async executeFunction(moduleId, functionName, parameters, context = {}) {
    try {
      // Validate function exists
      const validation = this.moduleRegistry.validateFunction(
        moduleId,
        functionName,
        parameters
      );
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          response: `I couldn't process that request: ${validation.error}`,
        };
      }

      // Execute function
      const result = await this.moduleRegistry.executeFunction(
        moduleId,
        functionName,
        parameters,
        context
      );

      return result;
    } catch (error) {
      logger.error("Function execution failed", {
        moduleId,
        functionName,
        parameters,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        response: "I encountered an error while processing your request.",
      };
    }
  }

  /**
   * Generate clarification response when intent is unclear
   */
  generateClarificationResponse(availableFunctions, detectedIntent) {
    const functionNames = availableFunctions.map((f) => f.name).join(", ");

    if (detectedIntent === "general_query") {
      return `I'm not sure what you'd like me to help you with. Here are some things I can do:\n\n${availableFunctions
        .map((f) => `• ${f.name}: ${f.description}`)
        .join("\n")}\n\nPlease be more specific about what you need.`;
    } else {
      return `I think you want to ${detectedIntent}, but I'm not completely sure. Could you please rephrase your request or be more specific?`;
    }
  }

  /**
   * Get available functions for a module
   */
  getAvailableFunctions(moduleId) {
    return this.moduleRegistry.getModuleFunctions(moduleId);
  }

  /**
   * Get function help text
   */
  getFunctionHelp(moduleId, functionName = null) {
    const functions = this.getAvailableFunctions(moduleId);

    if (functionName) {
      const func = functions.find((f) => f.name === functionName);
      if (func) {
        return {
          name: func.name,
          description: func.description,
          parameters: func.parameters || {},
          examples: func.examples || [],
        };
      }
      return null;
    }

    return functions.map((func) => ({
      name: func.name,
      description: func.description,
      parameters: func.parameters || {},
    }));
  }

  /**
   * Handle special commands
   */
  async handleSpecialCommand(message, moduleId, context = {}) {
    const lowerMessage = message.toLowerCase().trim();

    // Exit command
    if (
      lowerMessage.includes("exit") ||
      lowerMessage.includes("quit") ||
      lowerMessage.includes("menu")
    ) {
      return {
        success: true,
        isSpecialCommand: true,
        command: "exit",
        response:
          'You can now return to the main menu. Type "menu" to see available modules.',
      };
    }

    // Help command
    if (lowerMessage.includes("help") || lowerMessage === "?") {
      const functions = this.getAvailableFunctions(moduleId);
      const helpText = `Here's what I can help you with:\n\n${functions
        .map((f) => `• ${f.name}: ${f.description}`)
        .join("\n")}\n\nType "exit" to return to the main menu.`;

      return {
        success: true,
        isSpecialCommand: true,
        command: "help",
        response: helpText,
      };
    }

    // Status command
    if (lowerMessage.includes("status") || lowerMessage.includes("info")) {
      const module = this.moduleRegistry.getModule(moduleId);
      const statusText = `Current Module: ${
        module?.manifest.name || moduleId
      }\nActive Functions: ${
        this.getAvailableFunctions(moduleId).length
      }\nType "help" for available commands or "exit" to return to main menu.`;

      return {
        success: true,
        isSpecialCommand: true,
        command: "status",
        response: statusText,
      };
    }

    return null; // Not a special command
  }

  /**
   * Process message with fallback handling
   */
  async processMessage(message, moduleId, context = {}) {
    try {
      // Check for special commands first
      const specialCommand = await this.handleSpecialCommand(
        message,
        moduleId,
        context
      );
      if (specialCommand) {
        return specialCommand;
      }

      // Route to function
      const result = await this.routeMessage(message, moduleId, context);

      // If function routing failed, try to generate a helpful response
      if (
        !result.success &&
        result.error !== "Low confidence intent detection"
      ) {
        const fallbackResponse = await this.generateFallbackResponse(
          message,
          moduleId,
          context
        );
        return {
          ...result,
          response: fallbackResponse,
        };
      }

      return result;
    } catch (error) {
      logger.error("Message processing failed", {
        moduleId,
        message: message.substring(0, 50),
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        response:
          'I apologize, but I encountered an error. Please try again or type "help" for assistance.',
      };
    }
  }

  /**
   * Generate fallback response when function routing fails
   */
  async generateFallbackResponse(message, moduleId, context = {}) {
    try {
      const availableFunctions = this.getAvailableFunctions(moduleId);
      const functionNames = availableFunctions.map((f) => f.name).join(", ");

      const prompt = `The user sent: "${message}" in module ${moduleId}. Available functions: ${functionNames}. Generate a helpful response that acknowledges their message and guides them to use available functions.`;

      const response = await nlpService.generateResponse(
        prompt,
        context,
        availableFunctions
      );
      return response;
    } catch (error) {
      logger.error("Fallback response generation failed", {
        error: error.message,
      });
      return 'I understand you need help, but I\'m not sure how to assist with that specific request. Type "help" to see what I can do, or "exit" to return to the main menu.';
    }
  }
}

module.exports = new FunctionRouter();
