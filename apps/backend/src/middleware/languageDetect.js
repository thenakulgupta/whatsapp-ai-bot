const nlpService = require("../services/nlp");
const config = require("../config/env");
const logger = require("../config/logger");

/**
 * Language detection middleware
 */
const languageDetect = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      req.detectedLanguage = config.translation.defaultLanguage;
      return next();
    }

    // Detect language
    const detectedLanguage = await nlpService.detectLanguage(message);
    req.detectedLanguage = detectedLanguage;

    // If language is different from default, translate if needed
    if (detectedLanguage !== config.translation.defaultLanguage) {
      req.needsTranslation = true;
      req.sourceLanguage = detectedLanguage;
    } else {
      req.needsTranslation = false;
    }

    logger.info("Language detected", {
      message: message.substring(0, 50),
      detectedLanguage,
      needsTranslation: req.needsTranslation,
    });

    next();
  } catch (error) {
    logger.error("Language detection failed", { error: error.message });
    req.detectedLanguage = config.translation.defaultLanguage;
    req.needsTranslation = false;
    next();
  }
};

/**
 * Translation middleware
 */
const translateMessage = async (req, res, next) => {
  try {
    if (!req.needsTranslation || !req.body.message) {
      return next();
    }

    const { message } = req.body;
    const translatedMessage = await nlpService.translateText(
      message,
      config.translation.defaultLanguage,
      req.sourceLanguage
    );

    req.originalMessage = message;
    req.translatedMessage = translatedMessage;
    req.body.message = translatedMessage; // Use translated message for processing

    logger.info("Message translated", {
      original: message.substring(0, 50),
      translated: translatedMessage.substring(0, 50),
      from: req.sourceLanguage,
      to: config.translation.defaultLanguage,
    });

    next();
  } catch (error) {
    logger.error("Translation failed", { error: error.message });
    // Continue with original message if translation fails
    next();
  }
};

/**
 * Translate response back to user's language
 */
const translateResponse = async (
  response,
  targetLanguage,
  sourceLanguage = null
) => {
  try {
    if (!response || targetLanguage === config.translation.defaultLanguage) {
      return response;
    }

    const translatedResponse = await nlpService.translateText(
      response,
      targetLanguage,
      sourceLanguage || config.translation.defaultLanguage
    );

    logger.info("Response translated", {
      original: response.substring(0, 50),
      translated: translatedResponse.substring(0, 50),
      from: sourceLanguage || config.translation.defaultLanguage,
      to: targetLanguage,
    });

    return translatedResponse;
  } catch (error) {
    logger.error("Response translation failed", { error: error.message });
    return response; // Return original response if translation fails
  }
};

/**
 * Get supported languages
 */
const getSupportedLanguages = () => {
  return [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", nativeName: "Português" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  ];
};

/**
 * Validate language code
 */
const isValidLanguageCode = (code) => {
  const supportedLanguages = getSupportedLanguages();
  return supportedLanguages.some((lang) => lang.code === code);
};

/**
 * Get language name from code
 */
const getLanguageName = (code) => {
  const supportedLanguages = getSupportedLanguages();
  const language = supportedLanguages.find((lang) => lang.code === code);
  return language ? language.name : "Unknown";
};

/**
 * Get native language name from code
 */
const getNativeLanguageName = (code) => {
  const supportedLanguages = getSupportedLanguages();
  const language = supportedLanguages.find((lang) => lang.code === code);
  return language ? language.nativeName : "Unknown";
};

module.exports = {
  languageDetect,
  translateMessage,
  translateResponse,
  getSupportedLanguages,
  isValidLanguageCode,
  getLanguageName,
  getNativeLanguageName,
};
