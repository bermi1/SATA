import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: { SATA_DB_FILE: ".data/test-db.json", NODE_ENV: "test" },
  },
});
