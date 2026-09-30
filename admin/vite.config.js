import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.ADMIN_BASE || "/",
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "https://clothing-store-website-server.onrender.com",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
