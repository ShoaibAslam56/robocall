// Separate from vite.config.ts on purpose: that file loads the React Router
// and Shopify dev-server plugins, which unit tests don't need.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
