import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    allowedHosts: [""],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [tanstackRouter(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/dtos": path.resolve(__dirname, "../../packages/dtos/src/index.ts"),
      "@nestjs/swagger": path.resolve(__dirname, "./src/lib/swagger-shim.ts"),
    },
  },
});
