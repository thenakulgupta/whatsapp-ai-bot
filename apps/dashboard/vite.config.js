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
        target: `http://localhost:${process.env.VITE_BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: `http://localhost:${process.env.VITE_BACKEND_PORT}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
