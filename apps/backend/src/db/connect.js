const mongoose = require("mongoose");
const config = require("../config/env");
const logger = require("../config/logger");

// Import all models to ensure schemas are registered
const Chat = require("./models/Chat");
const Agent = require("./models/Agent");
const Module = require("./models/Module");
const Session = require("./models/Session");
const Ticket = require("./models/Ticket");
const UserModule = require("./models/UserModule");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Verify all models are registered
    const registeredModels = Object.keys(mongoose.models);
    logger.info(`Registered models: ${registeredModels.join(", ")}`);

    // Ensure all collections exist by creating indexes
    await Promise.all([
      Chat.createIndexes(),
      Agent.createIndexes(),
      Module.createIndexes(),
      Session.createIndexes(),
      Ticket.createIndexes(),
      UserModule.createIndexes(),
    ]);

    logger.info("All database indexes created successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = { connectDB };
