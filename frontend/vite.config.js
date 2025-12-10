import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import history from "connect-history-api-fallback";

export default defineConfig({
  plugins: [
    react(),
    {
      // Fix refresh on nested routes in Vite dev server
      name: "spa-fallback",
      configureServer(server) {
        server.middlewares.use(
          history({
            disableDotRule: true,
            htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
          })
        );
      },
    },
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,

    // Proxy ONLY API calls. Prevent frontend route collisions.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
