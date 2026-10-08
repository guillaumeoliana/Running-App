import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The old feature runtime is deliberately kept intact during the React migration.
  // Disabling Rollup tree-shaking also avoids pathological analysis of its giant
  // closure while still producing a minified ~92 kB gzip bundle.
  build: { rollupOptions: { treeshake: false } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
