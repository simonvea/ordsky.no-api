import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Without this, worktrees under .claude/ get picked up from the main checkout.
    include: ["src/**/*.test.ts"],
    // Pin the in-memory db so a DB_URL in the shell never points tests at real data.
    env: { DB_URL: ":memory:" },
  },
});
