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
        entities: intentResult.entities,
        reasoning: intentResult.reasoning,
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
        context,
        message
      );

      return {
        success: functionResult.success,
        functionName: intentResult.intent,
        parameters: intentResult.entities,
        result: functionResult.result,
        response: functionResult.response,
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
  async executeFunction(
    moduleId,
    functionName,
    parameters,
    context = {},
    message
  ) {
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
        context,
        message
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
    if (detectedIntent === "general_query") {
      // Format response with natural language examples instead of technical function names
      const options = availableFunctions
        .map((f) => {
          const example =
            f.examples && f.examples.length > 0 ? f.examples[0] : f.description;
          return `• ${f.description} - Try: "${example}"`;
        })
        .join("\n");

      return `I'm not sure what you'd like me to help you with. Here are some things I can do:\n\n${options}\n\nWhich option sounds like what you need? 😊`;
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
        .map((f) => {
          const example =
            f.examples && f.examples.length > 0 ? f.examples[0] : f.description;
          return `• ${f.description} - Try: "${example}"`;
        })
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

      // Build a helpful prompt with natural language examples
      const functionExamples = availableFunctions
        .map((f) => {
          const example =
            f.examples && f.examples.length > 0 ? f.examples[0] : f.description;
          return `${f.description} (e.g., "${example}")`;
        })
        .join(", ");

      const prompt = `The user sent: "${message}" in module ${moduleId}. 

Available capabilities: ${functionExamples}

Generate a helpful, friendly response that:
1. Acknowledges their message
2. Guides them naturally using real examples (NOT technical function names)
3. Uses conversational language like "Search for products by typing 'search product T-Shirt'" instead of "search_products [product name]"
4. Is warm and encouraging

Keep it brief and user-friendly.`;

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

      // Fallback with natural language examples
      const availableFunctions = this.getAvailableFunctions(moduleId);
      const examples = availableFunctions
        .slice(0, 3)
        .map((f) =>
          f.examples && f.examples.length > 0 ? f.examples[0] : null
        )
        .filter(Boolean)
        .join(", ");

      return `I understand you need help, but I'm not sure how to assist with that specific request. Try asking in natural language like: "${examples}". Type "help" to see more options, or "exit" to return to the main menu.`;
    }
  }
}

module.exports = new FunctionRouter();
