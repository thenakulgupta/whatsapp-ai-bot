module.exports = {
  apps: [
    {
      name: "whatsapp-ai-bot-backend",
      script: "npm",
      args: "run start:backend",
      cwd: "/var/www/whatsapp-ai-bot",
      watch: true,
      ignore_watch: ["uploads", "logs", "node_modules"],
    },
  ],
};
