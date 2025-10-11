const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      required: true,
      index: true,
    },
    activeModule: {
      type: String,
      required: true,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    contextData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    language: {
      type: String,
      default: "en",
    },
    userPreferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    escalationCount: {
      type: Number,
      default: 0,
    },
    lastEscalationAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
sessionSchema.index({ userPhone: 1, isActive: 1 });
sessionSchema.index({ activeModule: 1, isActive: 1 });
sessionSchema.index({ lastMessageAt: 1, isActive: 1 });

// Virtual for session duration
sessionSchema.virtual("duration").get(function () {
  const end = this.endTime || new Date();
  return end - this.startTime;
});

// Virtual for session age
sessionSchema.virtual("age").get(function () {
  return new Date() - this.lastMessageAt;
});

// Methods
sessionSchema.methods.isExpired = function (expiryHours = 24) {
  const expiryTime = expiryHours * 60 * 60 * 1000; // Convert to milliseconds
  return new Date() - this.lastMessageAt > expiryTime;
};

sessionSchema.methods.updateLastMessage = function () {
  this.lastMessageAt = new Date();
  this.messageCount += 1;
  return this.save();
};

sessionSchema.methods.addContext = function (key, value) {
  this.contextData[key] = value;
  return this.save();
};

sessionSchema.methods.getContext = function (key) {
  return this.contextData[key];
};

sessionSchema.methods.clearContext = function () {
  this.contextData = {};
  return this.save();
};

sessionSchema.methods.escalate = function () {
  this.escalationCount += 1;
  this.lastEscalationAt = new Date();
  return this.save();
};

sessionSchema.methods.end = function () {
  this.isActive = false;
  this.endTime = new Date();
  return this.save();
};

sessionSchema.methods.reset = function (newModule = null) {
  this.isActive = true;
  this.startTime = new Date();
  this.endTime = null;
  this.messageCount = 0;
  this.escalationCount = 0;
  this.lastEscalationAt = null;
  this.contextData = {};

  if (newModule) {
    this.activeModule = newModule;
  }

  return this.save();
};

// Static methods
sessionSchema.statics.findActiveSession = function (userPhone) {
  return this.findOne({
    userPhone,
    isActive: true,
  }).sort({ lastMessageAt: -1 });
};

sessionSchema.statics.findOrCreateSession = async function (
  userPhone,
  moduleId
) {
  let session = await this.findActiveSession(userPhone);

  if (!session || session.isExpired()) {
    if (session) {
      await session.end();
    }

    session = new this({
      userPhone,
      activeModule: moduleId,
      lastMessageAt: new Date(),
    });

    await session.save();
  }

  return session;
};

sessionSchema.statics.getExpiredSessions = function (expiryHours = 24) {
  const expiryTime = new Date(Date.now() - expiryHours * 60 * 60 * 1000);
  return this.find({
    isActive: true,
    lastMessageAt: { $lt: expiryTime },
  });
};

sessionSchema.statics.cleanupExpiredSessions = async function (
  expiryHours = 24
) {
  const expiredSessions = await this.getExpiredSessions(expiryHours);

  for (const session of expiredSessions) {
    await session.end();
  }

  return expiredSessions.length;
};

module.exports = mongoose.model("Session", sessionSchema);
