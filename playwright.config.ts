import { defineConfig, devices } from "@playwright/test";

/**
 * Chanakya E2E configuration.
 *
 * Specs assume:
 *   - A dev server is running at http://localhost:3000 (`pnpm dev`).
 *   - The Supabase DB has been seeded (`pnpm db:seed`).
 *   - The 6 demo accounts exist with password "demo".
 *
 * The `auth` setup project logs in as the CFO once and saves storage state;
 * the other projects reuse that state so each spec doesn't need to log in.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: false, // many specs mutate shared DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "auth-setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "scenarios",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/cfo.json",
      },
      dependencies: ["auth-setup"],
    },
  ],
});
