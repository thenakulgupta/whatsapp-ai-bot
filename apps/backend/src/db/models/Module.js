const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "🏢",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    functions: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        parameters: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    welcomeMessage: {
      type: String,
      required: true,
    },
    exitMessage: {
      type: String,
      default:
        'Thank you for using our service! Type "exit" to return to the main menu.',
    },
    stats: {
      totalSessions: {
        type: Number,
        default: 0,
      },
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalEscalations: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
moduleSchema.index({ id: 1 });
moduleSchema.index({ isActive: 1 });
moduleSchema.index({ createdAt: -1 });

// Virtual for module path
moduleSchema.virtual("path").get(function () {
  return `modules/${this.id}`;
});

// Methods
moduleSchema.methods.incrementStats = function (field, amount = 1) {
  this.stats[field] = (this.stats[field] || 0) + amount;
  return this.save();
};

moduleSchema.methods.updateResponseTime = function (responseTime) {
  const currentAvg = this.stats.averageResponseTime || 0;
  const totalMessages = this.stats.totalMessages || 1;
  this.stats.averageResponseTime =
    (currentAvg * (totalMessages - 1) + responseTime) / totalMessages;
  return this.save();
};

moduleSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.config; // Remove sensitive config
  return obj;
};

module.exports = mongoose.model("Module", moduleSchema);
