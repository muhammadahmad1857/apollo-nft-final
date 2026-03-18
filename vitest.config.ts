import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [
      // hook tests need a browser-like environment
      ["src/__tests__/hooks/**", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
