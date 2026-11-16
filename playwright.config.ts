import { defineConfig, devices } from "@playwright/test";

// Target app: WealthLite production by default, or BASE_URL (for example a local `npm run dev` of wealthlite).
const baseURL = process.env.BASE_URL ?? "https://wealthlite.aswin-qa.workers.dev";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["unit/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a flaky pass would hide exactly what the dashboard is meant to show.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["./reporters/results-api.ts"],
    ...(process.env.CI ? ([["github"]] as const) : []),
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } }],
});
