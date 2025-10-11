const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["user", "ai", "human"],
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: [
        "text",
        "image",
        "document",
        "audio",
        "video",
        "location",
        "contact",
        "interactive",
      ],
      default: "text",
    },
    intent: {
      type: String,
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    functionCalled: {
      name: String,
      parameters: mongoose.Schema.Types.Mixed,
      result: mongoose.Schema.Types.Mixed,
      executionTime: Number,
    },
    response: {
      type: String,
    },
    responseTime: {
      type: Number, // in milliseconds
    },
    language: {
      type: String,
      default: "en",
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    escalatedAt: {
      type: Date,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "escalated"],
      default: "pending",
      index: true,
    },
    error: {
      message: String,
      stack: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
chatSchema.index({ userPhone: 1, moduleId: 1, createdAt: -1 });
chatSchema.index({ moduleId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1, createdAt: -1 });
chatSchema.index({ isEscalated: 1, createdAt: -1 });
chatSchema.index({ status: 1, createdAt: -1 });

// Virtual for message age
chatSchema.virtual("age").get(function () {
  return new Date() - this.createdAt;
});

// Methods
chatSchema.methods.markAsProcessing = function () {
  this.status = "processing";
  return this.save();
};

chatSchema.methods.markAsCompleted = function (response, responseTime) {
  this.status = "completed";
  this.response = response;
  this.responseTime = responseTime;
  return this.save();
};

chatSchema.methods.markAsFailed = function (error) {
  this.status = "failed";
  this.error = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
  };
  return this.save();
};

chatSchema.methods.escalate = function (agentId) {
  this.isEscalated = true;
  this.escalatedTo = agentId;
  this.escalatedAt = new Date();
  this.status = "escalated";
  return this.save();
};

chatSchema.methods.setFunctionCall = function (functionData) {
  this.functionCalled = functionData;
  return this.save();
};

chatSchema.methods.setIntent = function (intent, confidence) {
  this.intent = intent;
  this.confidence = confidence;
  return this.save();
};

// Static methods
chatSchema.statics.getChatHistory = function (userPhone, moduleId, limit = 50) {
  return this.find({
    userPhone,
    moduleId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sessionId", "activeModule contextData")
    .populate("escalatedTo", "name email");
};

chatSchema.statics.getModuleChats = function (moduleId, limit = 100, skip = 0) {
  return this.find({ moduleId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sessionId", "userPhone activeModule")
    .populate("escalatedTo", "name email");
};

chatSchema.statics.getEscalatedChats = function (moduleId = null) {
  const query = { isEscalated: true };
  if (moduleId) {
    query.moduleId = moduleId;
  }

  return this.find(query)
    .sort({ escalatedAt: -1 })
    .populate("sessionId", "userPhone activeModule")
    .populate("escalatedTo", "name email")
    .populate("ticketId");
};

chatSchema.statics.getAnalytics = function (moduleId, startDate, endDate) {
  const matchStage = {
    moduleId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ["$senderType", "user"] }, 1, 0] },
        },
        aiMessages: {
          $sum: { $cond: [{ $eq: ["$senderType", "ai"] }, 1, 0] },
        },
        humanMessages: {
          $sum: { $cond: [{ $eq: ["$senderType", "human"] }, 1, 0] },
        },
        escalatedMessages: {
          $sum: { $cond: ["$isEscalated", 1, 0] },
        },
        averageResponseTime: { $avg: "$responseTime" },
        uniqueUsers: { $addToSet: "$userPhone" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMessages: 1,
        userMessages: 1,
        aiMessages: 1,
        humanMessages: 1,
        escalatedMessages: 1,
        averageResponseTime: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
      },
    },
  ]);
};

module.exports = mongoose.model("Chat", chatSchema);
