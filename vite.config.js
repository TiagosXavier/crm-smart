import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"

export default defineConfig(({ command }) => {
  // Use root path for Vercel, GitHub Pages path for gh-pages deploy
  const isVercel = process.env.VERCEL === '1';
  const base = command === 'build' && !isVercel ? '/crm-inteligente/' : '/';

  return {
    base,
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(new URL(import.meta.url).pathname), "./src"),
      },
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/ai-agent-api': {
          target: 'https://crmaiagent-production.up.railway.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-agent-api/, ''),
        },
      },
    },
  };
});
