const express = require("express");
const router = express.Router();
const whatsappService = require("../services/whatsapp");
const functionRouter = require("../services/functionRouter");
const { sessionGate } = require("../middleware/sessionGate");
const {
  languageDetect,
  translateMessage,
  translateResponse,
} = require("../middleware/languageDetect");
const Chat = require("../db/models/Chat");
const logger = require("../config/logger");

/**
 * WhatsApp webhook verification
 */
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verificationResult = whatsappService.verifyWebhook(
    mode,
    token,
    challenge
  );

  if (verificationResult) {
    logger.info("Webhook verification successful");
    res.status(200).send(challenge);
  } else {
    logger.warn("Webhook verification failed", { mode, token });
    res.status(403).json({ error: "Verification failed" });
  }
});

/**
 * WhatsApp webhook for incoming messages
 */
router.post(
  "/whatsapp",
  sessionGate,
  languageDetect,
  translateMessage,
  async (req, res) => {
    try {
      const webhookData = whatsappService.processWebhookData(req.body);

      if (!webhookData) {
        logger.warn("Invalid webhook data received");
        return res.status(400).json({ error: "Invalid webhook data" });
      }

      const { messageId, from, message, type, contact } = webhookData;

      logger.info("Received WhatsApp message", {
        from,
        messageId,
        type,
        messageLength: message?.length || 0,
      });

      // Mark message as read
      await whatsappService.markAsRead(messageId);

      // Handle different message types
      if (type === "text" && message) {
        await handleTextMessage(from, message, req, res);
      } else if (type === "interactive") {
        await handleInteractiveMessage(from, req.body, req, res);
      } else {
        logger.info("Unsupported message type", { type, from });
        await whatsappService.sendTextMessage(
          from,
          "I can only process text messages at the moment. Please send your message as text."
        );
      }

      res.status(200).json({ status: "success" });
    } catch (error) {
      logger.error("Webhook processing failed", { error: error.message });
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

/**
 * Handle text messages
 */
async function handleTextMessage(from, message, req, res) {
  try {
    const startTime = Date.now();

    // Create chat record
    const chat = new Chat({
      userPhone: from,
      moduleId: req.session?.activeModule || "none",
      sessionId: req.session?._id,
      message: message,
      senderType: "user",
      messageType: "text",
      language: req.detectedLanguage,
      status: "processing",
    });

    await chat.save();

    // Check if user needs module selection
    if (req.needsModuleSelection) {
      await handleModuleSelection(from, message, req, chat);
      return;
    }

    // Process message through function router
    const result = await functionRouter.processMessage(
      message,
      req.session.activeModule,
      {
        userPhone: from,
        sessionId: req.session._id,
        sessionContext: req.session.contextData,
        detectedLanguage: req.detectedLanguage,
        originalMessage: req.originalMessage,
      }
    );

    // Update chat record
    const responseTime = Date.now() - startTime;
    await chat.markAsCompleted(result.response, responseTime);

    if (result.functionName) {
      await chat.setFunctionCall({
        name: result.functionName,
        parameters: result.parameters,
        result: result.result,
        executionTime: responseTime,
      });
    }

    if (result.intent) {
      await chat.setIntent(result.intent, result.confidence);
    }

    // Translate response back to user's language if needed
    let finalResponse = result.response;
    if (req.needsTranslation && req.detectedLanguage !== "en") {
      finalResponse = await translateResponse(
        result.response,
        req.detectedLanguage
      );
    }

    // Send response
    await whatsappService.sendTextMessage(from, finalResponse);

    // Handle special commands
    if (result.isSpecialCommand) {
      if (result.command === "exit") {
        await req.sessionManager.endSession(from);
      }
    }

    logger.info("Message processed successfully", {
      from,
      responseTime,
      functionCalled: result.functionName,
      intent: result.intent,
    });
  } catch (error) {
    logger.error("Text message handling failed", {
      from,
      error: error.message,
    });

    // Send error message to user
    await whatsappService.sendTextMessage(
      from,
      "I apologize, but I encountered an error processing your message. Please try again."
    );
  }
}

/**
 * Handle interactive messages (buttons, lists)
 */
async function handleInteractiveMessage(from, body, req, res) {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const interactive = value?.messages?.[0]?.interactive;

    if (!interactive) {
      logger.warn("Invalid interactive message", { from });
      return;
    }

    const buttonId = interactive.button_reply?.id || interactive.list_reply?.id;
    const buttonTitle =
      interactive.button_reply?.title || interactive.list_reply?.title;

    logger.info("Received interactive message", {
      from,
      buttonId,
      buttonTitle,
    });

    // Handle different button actions
    if (buttonId?.startsWith("module_")) {
      const moduleId = buttonId.replace("module_", "");
      await handleModuleSelection(from, moduleId, req);
    } else if (buttonId === "exit_confirm") {
      await handleExitConfirmation(from, req);
    } else if (buttonId === "continue") {
      await whatsappService.sendTextMessage(
        from,
        "Great! How can I help you today?"
      );
    } else {
      // Treat as regular text message
      await handleTextMessage(from, buttonTitle, req, res);
    }
  } catch (error) {
    logger.error("Interactive message handling failed", {
      from,
      error: error.message,
    });
    await whatsappService.sendTextMessage(
      from,
      "I encountered an error processing your selection. Please try again."
    );
  }
}

/**
 * Handle module selection
 */
async function handleModuleSelection(from, message, req, chat = null) {
  try {
    // Get available modules
    const availableModules = await req.sessionManager.getAvailableModules();

    if (availableModules.length === 0) {
      await whatsappService.sendTextMessage(
        from,
        "Sorry, no demo modules are currently available. Please try again later."
      );
      return;
    }

    // Check if user selected a specific module
    const selectedModule = availableModules.find(
      (module) =>
        module.id.toLowerCase() === message.toLowerCase() ||
        module.name.toLowerCase().includes(message.toLowerCase())
    );

    if (selectedModule) {
      // Switch to selected module
      const newSession = await req.sessionManager.switchModule(
        from,
        selectedModule.id
      );

      // Send welcome message
      await whatsappService.sendTextMessage(
        from,
        selectedModule.welcomeMessage
      );

      // Update chat record if exists
      if (chat) {
        chat.moduleId = selectedModule.id;
        chat.sessionId = newSession._id;
        await chat.save();
      }

      logger.info("User selected module", {
        from,
        moduleId: selectedModule.id,
      });
    } else {
      // Send module selection menu
      await whatsappService.sendModuleMenu(from, availableModules);
    }
  } catch (error) {
    logger.error("Module selection failed", { from, error: error.message });
    await whatsappService.sendTextMessage(
      from,
      "I encountered an error. Please try selecting a module again."
    );
  }
}

/**
 * Handle exit confirmation
 */
async function handleExitConfirmation(from, req) {
  try {
    await req.sessionManager.endSession(from);

    // Get available modules for new menu
    const availableModules = await req.sessionManager.getAvailableModules();
    await whatsappService.sendModuleMenu(from, availableModules);

    logger.info("User exited module", {
      from,
      moduleId: req.session?.activeModule,
    });
  } catch (error) {
    logger.error("Exit confirmation failed", { from, error: error.message });
    await whatsappService.sendTextMessage(
      from,
      "I encountered an error. Please try again."
    );
  }
}

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "whatsapp-webhook",
  });
});

module.exports = router;
