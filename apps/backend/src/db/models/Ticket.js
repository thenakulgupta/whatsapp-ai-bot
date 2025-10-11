const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    userPhone: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
        "cancelled",
      ],
      default: "open",
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    resolution: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        filename: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    notes: [
      {
        content: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Agent",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    escalationLevel: {
      type: Number,
      default: 1,
    },
    escalatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    escalatedAt: {
      type: Date,
    },
    slaDeadline: {
      type: Date,
    },
    responseTime: {
      type: Number, // in minutes
    },
    resolutionTime: {
      type: Number, // in minutes
    },
    customerSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      ratedAt: Date,
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

// Compound indexes
ticketSchema.index({ moduleId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ userPhone: 1, moduleId: 1, createdAt: -1 });
ticketSchema.index({ priority: 1, status: 1, createdAt: -1 });

// Virtual for ticket age
ticketSchema.virtual("age").get(function () {
  return new Date() - this.createdAt;
});

// Virtual for time to resolution
ticketSchema.virtual("timeToResolution").get(function () {
  if (this.resolvedAt) {
    return this.resolvedAt - this.createdAt;
  }
  return null;
});

// Methods
ticketSchema.methods.assign = function (agentId) {
  this.assignedTo = agentId;
  this.assignedAt = new Date();
  this.status = "assigned";
  return this.save();
};

ticketSchema.methods.startProgress = function () {
  this.status = "in_progress";
  return this.save();
};

ticketSchema.methods.resolve = function (resolution) {
  this.status = "resolved";
  this.resolvedAt = new Date();
  this.resolution = resolution;
  this.resolutionTime = Math.round(
    (this.resolvedAt - this.createdAt) / (1000 * 60)
  ); // in minutes
  return this.save();
};

ticketSchema.methods.close = function () {
  this.status = "closed";
  this.closedAt = new Date();
  return this.save();
};

ticketSchema.methods.cancel = function () {
  this.status = "cancelled";
  this.closedAt = new Date();
  return this.save();
};

ticketSchema.methods.escalate = function (agentId, level = null) {
  this.escalatedFrom = this.assignedTo;
  this.assignedTo = agentId;
  this.escalatedAt = new Date();
  this.escalationLevel = level || this.escalationLevel + 1;
  this.status = "assigned";
  return this.save();
};

ticketSchema.methods.addNote = function (content, authorId) {
  this.notes.push({
    content,
    author: authorId,
    createdAt: new Date(),
  });
  return this.save();
};

ticketSchema.methods.setSatisfaction = function (rating, feedback = null) {
  this.customerSatisfaction = {
    rating,
    feedback,
    ratedAt: new Date(),
  };
  return this.save();
};

ticketSchema.methods.addTag = function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

ticketSchema.methods.removeTag = function (tag) {
  this.tags = this.tags.filter((t) => t !== tag);
  return this.save();
};

// Static methods
ticketSchema.statics.getModuleTickets = function (
  moduleId,
  status = null,
  limit = 50,
  skip = 0
) {
  const query = { moduleId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("assignedTo", "name email")
    .populate("chatId", "message senderType")
    .populate("sessionId", "userPhone activeModule");
};

ticketSchema.statics.getAgentTickets = function (agentId, status = null) {
  const query = { assignedTo: agentId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ priority: 1, createdAt: -1 })
    .populate("chatId", "message senderType")
    .populate("sessionId", "userPhone activeModule");
};

ticketSchema.statics.getAnalytics = function (moduleId, startDate, endDate) {
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
        totalTickets: { $sum: 1 },
        openTickets: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
        assignedTickets: {
          $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
        },
        inProgressTickets: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        resolvedTickets: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        closedTickets: {
          $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
        },
        averageResolutionTime: { $avg: "$resolutionTime" },
        averageResponseTime: { $avg: "$responseTime" },
        averageSatisfaction: { $avg: "$customerSatisfaction.rating" },
      },
    },
    {
      $project: {
        _id: 0,
        totalTickets: 1,
        openTickets: 1,
        assignedTickets: 1,
        inProgressTickets: 1,
        resolvedTickets: 1,
        closedTickets: 1,
        averageResolutionTime: 1,
        averageResponseTime: 1,
        averageSatisfaction: 1,
      },
    },
  ]);
};

module.exports = mongoose.model("Ticket", ticketSchema);
