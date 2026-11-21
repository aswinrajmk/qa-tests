import { defineConfig, devices } from "@playwright/test";
import { env } from "./config/env.ts";

// Suites are selected by tag, not by file lists: `npm run test:smoke` is `--grep @smoke`.
// See docs/CONVENTIONS.md for the tagging rules that scripts/check-tags.ts enforces.

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["unit/**"],
  fullyParallel: true,
  forbidOnly: env.isCI,
  // No retries: a flaky pass would hide exactly what the dashboard is meant to show.
  retries: 0,
  workers: env.workers,
  timeout: env.testTimeoutMs,
  expect: { timeout: env.expectTimeoutMs },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["./src/reporters/results-api.ts"],
    ...(env.isCI ? ([["github"]] as const) : []),
  ],
  use: {
    baseURL: env.baseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testMatch: "ui/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
    // API specs need no browser. They run once, outside the browser matrix.
    { name: "api", testMatch: "api/**/*.spec.ts" },
    // More browsers are one entry away, e.g. { name: "firefox", testMatch: "ui/**/*.spec.ts", use: devices["Desktop Firefox"] }.
  ],
});
