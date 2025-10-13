const axios = require("axios");
const config = require("../config/env");
const logger = require("../config/logger");

class WhatsAppService {
  constructor() {
    this.accessToken = config.whatsapp.accessToken;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.apiUrl = config.whatsapp.apiUrl;
    this.businessAccountId = config.whatsapp.businessAccountId;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("Text message sent successfully", {
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send text message", {
        to,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Send an interactive message with buttons
   */
  async sendInteractiveMessage(to, bodyText, buttons) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: bodyText,
            },
            action: {
              buttons: buttons.map((button, index) => ({
                type: "reply",
                reply: {
                  id: button.id,
                  title: button.title,
                },
              })),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("Interactive message sent successfully", {
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send interactive message", {
        to,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Send a list message
   */
  async sendListMessage(to, bodyText, buttonText, sections) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "interactive",
          interactive: {
            type: "list",
            body: {
              text: bodyText,
            },
            action: {
              button: buttonText,
              sections: sections,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("List message sent successfully", {
        to,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send list message", {
        to,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to,
    templateName,
    languageCode = "en",
    components = []
  ) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
            components: components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("Template message sent successfully", {
        to,
        templateName,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send template message", {
        to,
        templateName,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Send a media message (image, document, etc.)
   */
  async sendMediaMessage(to, mediaType, mediaUrl, caption = null) {
    try {
      const messageData = {
        messaging_product: "whatsapp",
        to: to,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
        },
      };

      if (caption && (mediaType === "image" || mediaType === "document")) {
        messageData[mediaType].caption = caption;
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("Media message sent successfully", {
        to,
        mediaType,
        messageId: response.data.messages[0].id,
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to send media message", {
        to,
        mediaType,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("Message marked as read", { messageId });
      return response.data;
    } catch (error) {
      logger.error("Failed to mark message as read", {
        messageId,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${mediaId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.data.url;
    } catch (error) {
      logger.error("Failed to get media URL", {
        mediaId,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Download media from URL
   */
  async downloadMedia(mediaUrl) {
    try {
      const response = await axios.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        responseType: "arraybuffer",
      });

      return response.data;
    } catch (error) {
      logger.error("Failed to download media", {
        mediaUrl,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(mode, token, challenge) {
    if (mode === "subscribe" && token === config.whatsapp.webhookVerifyToken) {
      logger.info("Webhook verified successfully");
      return challenge;
    }

    logger.warn("Webhook verification failed", { mode, token });
    return null;
  }

  /**
   * Process incoming webhook data
   */
  processWebhookData(body) {
    try {
      let value;

      // Handle WebSocket format (field + value structure)
      if (body.field && body.value) {
        value = body.value;
      } else {
        // Handle standard webhook format (entry + changes structure)
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        value = changes?.value;
      }

      if (!value?.messages) {
        return null;
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];
      const metadata = value.metadata;

      return {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text?.body,
        context: message.context,
        contact: {
          name: contact?.profile?.name,
          phone: contact?.wa_id,
        },
        metadata: {
          phoneNumberId: metadata?.phone_number_id,
          displayPhoneNumber: metadata?.display_phone_number,
        },
      };
    } catch (error) {
      logger.error("Failed to process webhook data", { error: error.message });
      return null;
    }
  }

  /**
   * Send module selection menu
   */
  async sendModuleMenu(to, modules) {
    const sections = [
      {
        title: "Available Demo Modules",
        rows: modules.map((module) => ({
          id: `module_${module.id}`,
          title: `${module.icon} ${module.name}`,
          description: module.description,
        })),
      },
    ];

    return this.sendListMessage(
      to,
      "👋 Hi! Welcome to the Universal AI Demo Platform.\n\nPlease choose a demo module to explore:",
      "Select Module",
      sections
    );
  }

  /**
   * Send exit confirmation
   */
  async sendExitConfirmation(to) {
    const buttons = [
      {
        id: "exit_confirm",
        title: "🚪 Exit Demo",
      },
      {
        id: "continue",
        title: "Continue",
      },
    ];

    return this.sendInteractiveMessage(
      to,
      "Are you sure you want to exit the current demo module?",
      buttons
    );
  }
}

module.exports = new WhatsAppService();
