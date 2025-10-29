const fs = require("fs");
const path = require("path");
const Module = require("../db/models/Module");
const logger = require("../config/logger");
const { default: axios } = require("axios");

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.modulesPath = path.join(__dirname);
  }

  /**
   * Initialize module registry
   */
  async initialize() {
    try {
      logger.info("Initializing module registry...");

      // Load modules from filesystem
      await this.loadModulesFromFilesystem();

      // Sync with database
      await this.syncWithDatabase();

      logger.info(
        `Module registry initialized with ${this.modules.size} modules`
      );
    } catch (error) {
      logger.error("Failed to initialize module registry", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load modules from filesystem
   */
  async loadModulesFromFilesystem() {
    try {
      const moduleDirs = fs
        .readdirSync(this.modulesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const moduleDir of moduleDirs) {
        if (moduleDir === "registry.js") continue; // Skip registry file

        const modulePath = path.join(this.modulesPath, moduleDir);
        const manifestPath = path.join(modulePath, "manifest.js");

        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = require(manifestPath);
            const module = await this.loadModule(
              moduleDir,
              manifest,
              modulePath
            );
            this.modules.set(moduleDir, module);
            logger.info(`Loaded module: ${moduleDir}`);
          } catch (error) {
            logger.error(`Failed to load module ${moduleDir}`, {
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Failed to load modules from filesystem", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load individual module
   */
  async loadModule(moduleId, manifest, modulePath) {
    const functions = new Map();

    // Load functions
    const functionsPath = path.join(modulePath, "functions");
    if (fs.existsSync(functionsPath)) {
      const functionFiles = fs
        .readdirSync(functionsPath)
        .filter((file) => file.endsWith(".js"))
        .map((file) => file.replace(".js", ""));

      for (const functionName of functionFiles) {
        try {
          const functionPath = path.join(functionsPath, `${functionName}.js`);
          const functionModule = require(functionPath);
          functions.set(functionName, functionModule);
        } catch (error) {
          logger.error(
            `Failed to load function ${functionName} for module ${moduleId}`,
            { error: error.message }
          );
        }
      }
    }

    return {
      id: moduleId,
      manifest,
      functions,
      path: modulePath,
      loadedAt: new Date(),
    };
  }

  /**
   * Sync modules with database
   */
  async syncWithDatabase() {
    try {
      for (const [moduleId, module] of this.modules) {
        const existingModule = await Module.findOne({ id: moduleId });

        if (existingModule) {
          // Update existing module
          existingModule.name = module.manifest.name;
          existingModule.description = module.manifest.description;
          existingModule.icon = module.manifest.icon || "🏢";
          existingModule.functions = module.manifest.functions || [];
          existingModule.welcomeMessage = module.manifest.welcomeMessage;
          existingModule.exitMessage = module.manifest.exitMessage;
          existingModule.config = module.manifest.config || {};
          existingModule.isActive = true;

          await existingModule.save();
          logger.info(`Updated module in database: ${moduleId}`);
        } else {
          // Create new module
          const newModule = new Module({
            id: moduleId,
            name: module.manifest.name,
            description: module.manifest.description,
            icon: module.manifest.icon || "🏢",
            functions: module.manifest.functions || [],
            welcomeMessage: module.manifest.welcomeMessage,
            exitMessage: module.manifest.exitMessage,
            config: module.manifest.config || {},
            isActive: true,
          });

          await newModule.save();
          logger.info(`Created new module in database: ${moduleId}`);
        }
      }
    } catch (error) {
      logger.error("Failed to sync modules with database", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get module by ID
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  /**
   * Get all modules
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Get active modules
   */
  async getActiveModules() {
    try {
      const activeModules = await Module.find({ isActive: true })
        .select("id name description icon welcomeMessage exitMessage functions")
        .sort({ name: 1 });

      return activeModules;
    } catch (error) {
      logger.error("Failed to get active modules", { error: error.message });
      return [];
    }
  }

  /**
   * Execute module function
   */
  async executeFunction(moduleId, functionName, parameters, context = {}) {
    try {
      const module = this.getModule(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }

      const functionManifest = module?.manifest?.functions?.find(
        (f) => f?.name?.toLowerCase() === functionName?.toLowerCase()
      );

      const apiInfo = functionManifest?.apiInfo ?? null;

      if (!apiInfo) {
        throw new Error(
          `Function ${functionName} not found in module ${moduleId}`
        );
      }

      const url = apiInfo?.url ?? null;
      const method = apiInfo?.method ?? null;
      const headers = apiInfo?.headers ?? null;
      const body = apiInfo?.body ?? null;

      const bodyParams = {};

      Object.keys(body).forEach((key) => {
        bodyParams[key] = parameters[key];
      });

      let response = null;

      if (method?.toLowerCase() === "get") {
        response = await axios.get(url, { params: bodyParams, headers });
      } else if (method?.toLowerCase() === "post") {
        response = await axios.post(url, bodyParams, { headers });
      } else if (method?.toLowerCase() === "put") {
        response = await axios.put(url, bodyParams, {
          headers,
        });
      }

      console.log({ response });

      // Execute function
      // const result = await functionModule.execute(parameters, context);

      // logger.info(`Executed function ${functionName} in module ${moduleId}`, {
      //   parameters,
      //   success: result.success,
      // });

      // return result;
      return {};
    } catch (error) {
      logger.error(
        `Failed to execute function ${functionName} in module ${moduleId}`,
        {
          error: error.message,
          parameters,
        }
      );

      return {
        success: false,
        error: error.message,
        functionName,
        moduleId,
      };
    }
  }

  /**
   * Get available functions for module
   */
  getModuleFunctions(moduleId) {
    const module = this.getModule(moduleId);
    if (!module) {
      return [];
    }

    return module.manifest.functions || [];
  }

  /**
   * Validate module function
   */
  validateFunction(moduleId, functionName, parameters) {
    const module = this.getModule(moduleId);
    if (!module) {
      return { valid: false, error: "Module not found" };
    }

    const functionDef = module.manifest.functions?.find(
      (f) => f.name === functionName
    );
    if (!functionDef) {
      return { valid: false, error: "Function not found" };
    }

    // Basic parameter validation
    if (functionDef.required && functionDef.required.length > 0) {
      for (const requiredParam of functionDef.required) {
        if (!(requiredParam in parameters)) {
          return {
            valid: false,
            error: `Missing required parameter: ${requiredParam}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Reload module
   */
  async reloadModule(moduleId) {
    try {
      const modulePath = path.join(this.modulesPath, moduleId);
      const manifestPath = path.join(modulePath, "manifest.js");

      if (!fs.existsSync(manifestPath)) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Clear require cache
      delete require.cache[require.resolve(manifestPath)];

      const manifest = require(manifestPath);
      const module = await this.loadModule(moduleId, manifest, modulePath);
      this.modules.set(moduleId, module);

      // Update database
      await this.syncWithDatabase();

      logger.info(`Reloaded module: ${moduleId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to reload module ${moduleId}`, {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get module statistics
   */
  async getModuleStats(moduleId) {
    try {
      const module = await Module.findOne({ id: moduleId });
      if (!module) {
        return null;
      }

      return {
        id: module.id,
        name: module.name,
        stats: module.stats,
        isActive: module.isActive,
        functionCount: module.functions.length,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      };
    } catch (error) {
      logger.error(`Failed to get stats for module ${moduleId}`, {
        error: error.message,
      });
      return null;
    }
  }
}

// Create singleton instance
const moduleRegistry = new ModuleRegistry();

// Initialize function
const initializeModules = async () => {
  await moduleRegistry.initialize();
};

module.exports = {
  moduleRegistry,
  initializeModules,
};
