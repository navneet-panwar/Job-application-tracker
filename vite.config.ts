import { defineConfig } from "vitest/config";

// Using defineConfig from vitest/config so the test settings live in the same file.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
