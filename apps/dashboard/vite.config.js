import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
dotenv.config({
  path: "../../.env",
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.VITE_FRONTEND_PORT || 3000,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: process.env.VITE_BACKEND_URL,
        changeOrigin: true,
        ws: true,
        secure: process.env.CURRENT_ENV === "production",
        // Handle WebSocket upgrade properly
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("WebSocket proxy error:", err);
          });
          proxy.on("proxyReqWs", (proxyReq, req, socket) => {
            console.log("WebSocket proxy request:", req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
