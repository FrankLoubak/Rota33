/**
 * Finalidade: configuração do Vite (web) do Rota33.
 * Como funciona: habilita o plugin React e um proxy de /api → backend em dev.
 * Relações: as telas em src/ chamam a API via /api; backend em 3100.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:3100",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/__tests__/setup.ts",
  },
});
