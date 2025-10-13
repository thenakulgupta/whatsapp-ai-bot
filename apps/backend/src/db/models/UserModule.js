const mongoose = require("mongoose");

const userModuleSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      required: true,
      index: true,
    },
    activeModuleId: {
      type: String,
      required: true,
      index: true,
    },
    selectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index for automatic deletion
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
userModuleSchema.index({ userPhone: 1, isActive: 1 });
userModuleSchema.index({ activeModuleId: 1, isActive: 1 });

// Methods
userModuleSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

userModuleSchema.methods.extendExpiry = function (hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

userModuleSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

// Static methods
userModuleSchema.statics.findActiveModule = function (userPhone) {
  return this.findOne({
    userPhone,
    isActive: true,
    expiresAt: { $gt: new Date() }, // Not expired
  }).sort({ selectedAt: -1 });
};

userModuleSchema.statics.setActiveModule = async function (
  userPhone,
  moduleId,
  expiryHours = 24
) {
  try {
    // Deactivate any existing active module for this user
    await this.updateMany({ userPhone, isActive: true }, { isActive: false });

    // Create new active module selection
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const userModule = new this({
      userPhone,
      activeModuleId: moduleId,
      expiresAt,
    });

    await userModule.save();
    return userModule;
  } catch (error) {
    throw error;
  }
};

userModuleSchema.statics.clearActiveModule = async function (userPhone) {
  return this.updateMany({ userPhone, isActive: true }, { isActive: false });
};

userModuleSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

module.exports = mongoose.model("UserModule", userModuleSchema);
