const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "supervisor", "agent"],
      default: "agent",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    assignedModules: [
      {
        type: String,
        index: true,
      },
    ],
    maxConcurrentTickets: {
      type: Number,
      default: 5,
    },
    workingHours: {
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "17:00",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    languages: [
      {
        type: String,
        default: ["en"],
      },
    ],
    stats: {
      totalTicketsHandled: {
        type: Number,
        default: 0,
      },
      totalChatsHandled: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      averageResolutionTime: {
        type: Number,
        default: 0,
      },
      customerSatisfaction: {
        type: Number,
        default: 0,
      },
      escalationRate: {
        type: Number,
        default: 0,
      },
    },
    currentTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
agentSchema.index({ email: 1 });
agentSchema.index({ role: 1, isActive: 1 });
agentSchema.index({ assignedModules: 1, isActive: 1 });
agentSchema.index({ isOnline: 1, isActive: 1 });

// Virtual for full name
agentSchema.virtual("fullName").get(function () {
  return this.name;
});

// Virtual for current workload
agentSchema.virtual("currentWorkload").get(function () {
  return this.currentTickets.length;
});

// Virtual for workload percentage
agentSchema.virtual("workloadPercentage").get(function () {
  return (this.currentTickets.length / this.maxConcurrentTickets) * 100;
});

// Pre-save middleware to hash password
agentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
agentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

agentSchema.methods.updateLastActive = function () {
  this.lastActiveAt = new Date();
  this.isOnline = true;
  return this.save();
};

agentSchema.methods.goOffline = function () {
  this.isOnline = false;
  return this.save();
};

agentSchema.methods.goOnline = function () {
  this.isOnline = true;
  this.lastActiveAt = new Date();
  return this.save();
};

agentSchema.methods.assignTicket = function (ticketId) {
  if (!this.currentTickets.includes(ticketId)) {
    this.currentTickets.push(ticketId);
  }
  return this.save();
};

agentSchema.methods.unassignTicket = function (ticketId) {
  this.currentTickets = this.currentTickets.filter(
    (id) => !id.equals(ticketId)
  );
  return this.save();
};

agentSchema.methods.canTakeTicket = function () {
  return (
    this.isActive &&
    this.isOnline &&
    this.currentTickets.length < this.maxConcurrentTickets
  );
};

agentSchema.methods.updateStats = function (field, value) {
  this.stats[field] = value;
  return this.save();
};

agentSchema.methods.incrementStats = function (field, amount = 1) {
  this.stats[field] = (this.stats[field] || 0) + amount;
  return this.save();
};

agentSchema.methods.addSkill = function (skill) {
  if (!this.skills.includes(skill)) {
    this.skills.push(skill);
  }
  return this.save();
};

agentSchema.methods.removeSkill = function (skill) {
  this.skills = this.skills.filter((s) => s !== skill);
  return this.save();
};

agentSchema.methods.addLanguage = function (language) {
  if (!this.languages.includes(language)) {
    this.languages.push(language);
  }
  return this.save();
};

agentSchema.methods.removeLanguage = function (language) {
  this.languages = this.languages.filter((l) => l !== language);
  return this.save();
};

agentSchema.methods.assignModule = function (moduleId) {
  if (!this.assignedModules.includes(moduleId)) {
    this.assignedModules.push(moduleId);
  }
  return this.save();
};

agentSchema.methods.unassignModule = function (moduleId) {
  this.assignedModules = this.assignedModules.filter((m) => m !== moduleId);
  return this.save();
};

agentSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.metadata;
  return obj;
};

// Static methods
agentSchema.statics.findAvailableAgents = function (moduleId = null) {
  const query = {
    isActive: true,
    isOnline: true,
    $expr: { $lt: [{ $size: "$currentTickets" }, "$maxConcurrentTickets"] },
  };

  if (moduleId) {
    query.assignedModules = moduleId;
  }

  return this.find(query).sort({ "stats.averageResponseTime": 1 });
};

agentSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

agentSchema.statics.getOnlineAgents = function () {
  return this.find({ isOnline: true, isActive: true });
};

agentSchema.statics.getAnalytics = function (startDate, endDate) {
  const matchStage = {
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
        totalAgents: { $sum: 1 },
        activeAgents: {
          $sum: { $cond: ["$isActive", 1, 0] },
        },
        onlineAgents: {
          $sum: { $cond: ["$isOnline", 1, 0] },
        },
        averageTicketsHandled: { $avg: "$stats.totalTicketsHandled" },
        averageResponseTime: { $avg: "$stats.averageResponseTime" },
        averageSatisfaction: { $avg: "$stats.customerSatisfaction" },
      },
    },
    {
      $project: {
        _id: 0,
        totalAgents: 1,
        activeAgents: 1,
        onlineAgents: 1,
        averageTicketsHandled: 1,
        averageResponseTime: 1,
        averageSatisfaction: 1,
      },
    },
  ]);
};

module.exports = mongoose.model("Agent", agentSchema);
