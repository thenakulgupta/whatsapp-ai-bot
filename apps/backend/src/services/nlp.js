const Groq = require("groq-sdk");
const config = require("../config/env");
const logger = require("../config/logger");

class NLPService {
  constructor() {
    this.provider = config.ai.defaultProvider;
    this.groq = config.ai.groqApiKey
      ? new Groq({ apiKey: config.ai.groqApiKey })
      : null;
  }

  /**
   * Detect intent from user message
   */
  async detectIntent(message, availableFunctions = [], context = {}) {
    try {
      const systemPrompt = this.buildIntentDetectionPrompt(
        availableFunctions,
        context
      );

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const result = this.parseIntentResponse(response);
      logger.info("Intent detected", {
        message,
        intent: result.intent,
        confidence: result.confidence,
      });

      return result;
    } catch (error) {
      logger.error("Failed to detect intent", {
        message,
        error: error.message,
      });
      return {
        intent: "general_query",
        confidence: 0.5,
        entities: {},
        reasoning: "Intent detection failed, defaulting to general query",
      };
    }
  }

  /**
   * Generate response using AI
   */
  async generateResponse(message, context = {}, availableFunctions = []) {
    try {
      const systemPrompt = this.buildResponsePrompt(
        context,
        availableFunctions
      );

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const result = response.choices[0].message.content;
      logger.info("Response generated", {
        message,
        responseLength: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Failed to generate response", {
        message,
        error: error.message,
      });
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  }

  /**
   * Call function with AI assistance
   */
  async callFunction(functionName, parameters, context = {}) {
    try {
      const systemPrompt = this.buildFunctionCallPrompt(
        functionName,
        parameters,
        context
      );

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Execute function: ${functionName} with parameters: ${JSON.stringify(
              parameters
            )}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const result = response.choices[0].message.content;
      logger.info("Function call completed", { functionName, parameters });

      return {
        success: true,
        result: result,
        functionName,
        parameters,
      };
    } catch (error) {
      logger.error("Function call failed", {
        functionName,
        parameters,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
        functionName,
        parameters,
      };
    }
  }

  /**
   * Extract entities from message
   */
  async extractEntities(message, entityTypes = []) {
    try {
      const systemPrompt = this.buildEntityExtractionPrompt(entityTypes);

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const result = this.parseEntityResponse(response);
      logger.info("Entities extracted", { message, entities: result });

      return result;
    } catch (error) {
      logger.error("Failed to extract entities", {
        message,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Translate text
   */
  async translateText(text, targetLanguage = "en", sourceLanguage = "auto") {
    try {
      const systemPrompt = `You are a translation assistant. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else.`;

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const translatedText = response.choices[0].message.content.trim();
      logger.info("Text translated", {
        sourceLanguage,
        targetLanguage,
        textLength: text.length,
      });

      return translatedText;
    } catch (error) {
      logger.error("Translation failed", {
        text,
        targetLanguage,
        error: error.message,
      });
      return text; // Return original text if translation fails
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    try {
      const systemPrompt =
        'Detect the language of the following text. Respond with only the ISO 639-1 language code (e.g., "en", "es", "fr").';

      const response = await this.callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const language = response.choices[0].message.content.trim().toLowerCase();
      logger.info("Language detected", {
        text: text.substring(0, 50),
        language,
      });

      return language;
    } catch (error) {
      logger.error("Language detection failed", { text, error: error.message });
      return "en"; // Default to English
    }
  }

  /**
   * Call AI service (Groq)
   */
  async callAI(options) {
    if (this.provider === "groq" && this.groq) {
      return this.callGroq(options);
    } else {
      throw new Error("No AI provider configured");
    }
  }

  /**
   * Call Groq API
   */
  async callGroq(options) {
    try {
      const response = await this.groq.chat.completions.create({
        model: config.ai.groqModel,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      });

      return response;
    } catch (error) {
      logger.error("Groq API call failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Build intent detection prompt
   */
  buildIntentDetectionPrompt(availableFunctions, context) {
    const functionList = availableFunctions
      .map(
        (func) =>
          `- ${func.name}: ${func.description}. Parameters: ${JSON.stringify(func.parameters)}. Required: ${JSON.stringify(func.required)}`
      )
      .join("\n");

    return `You are an intent detection system for a WhatsApp AI assistant. 
    
Available functions:
${functionList}

Context: ${JSON.stringify(context)}

Analyze the user's message and determine:
1. The primary intent (function name or 'general_query')
2. Confidence level (0.0 to 1.0)
3. Extracted entities/parameters
4. Reasoning

Respond in JSON format:
{
  "intent": "function_name_or_general_query",
  "confidence": 0.95,
  "entities": {"param1": "value1"},
  "reasoning": "Brief explanation"
}`;
  }

  /**
   * Build response generation prompt
   */
  buildResponsePrompt(context, availableFunctions) {
    const moduleInfo = context.module
      ? `Current module: ${context.module.name} (${context.module.description})`
      : "";
    const sessionContext = context.session
      ? `Session context: ${JSON.stringify(context.session.contextData)}`
      : "";

    return `You are a helpful AI assistant for a WhatsApp business support system.

${moduleInfo}
${sessionContext}

Available functions: ${availableFunctions.map((f) => f.name).join(", ")}

Guidelines:
- Be friendly, helpful, and professional
- Keep responses concise and clear
- Use emojis appropriately
- If you need to call a function, mention it naturally
- If you don't understand, ask for clarification
- Always maintain context of the current module

Respond naturally to the user's message.`;
  }

  /**
   * Build function call prompt
   */
  buildFunctionCallPrompt(functionName, parameters, context) {
    return `You are executing the function "${functionName}" with parameters: ${JSON.stringify(
      parameters
    )}

Context: ${JSON.stringify(context)}

Execute the function logic and return a natural response that would be sent to the user. 
Make it conversational and helpful.`;
  }

  /**
   * Build entity extraction prompt
   */
  buildEntityExtractionPrompt(entityTypes) {
    return `Extract the following entities from the user's message: ${entityTypes.join(
      ", "
    )}

Respond in JSON format:
{
  "entity1": "value1",
  "entity2": "value2"
}

If an entity is not found, omit it from the response.`;
  }

  /**
   * Parse intent detection response
   */
  parseIntentResponse(response) {
    try {
      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      return {
        intent: parsed.intent || "general_query",
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        entities: parsed.entities || {},
        reasoning: parsed.reasoning || "Intent detected",
      };
    } catch (error) {
      logger.error("Failed to parse intent response", { error: error.message });
      return {
        intent: "general_query",
        confidence: 0.5,
        entities: {},
        reasoning: "Failed to parse intent response",
      };
    }
  }

  /**
   * Parse entity extraction response
   */
  parseEntityResponse(response) {
    try {
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      logger.error("Failed to parse entity response", { error: error.message });
      return {};
    }
  }
}

module.exports = new NLPService();
