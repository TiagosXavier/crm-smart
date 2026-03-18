import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => {
  // Use root path for Vercel, GitHub Pages path for gh-pages deploy
  const isVercel = process.env.VERCEL === "1";
  const base = command === "build" && !isVercel ? "/crm-inteligente/" : "/";

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: true,
      proxy: {
        // Proxy para a API de agentes IA externa (Railway)
        "/ai-agent-api": {
          target: "https://crmaiagent-production.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-agent-api/, ""),
        },
      },
    },
  };
});
