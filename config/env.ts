import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// One typed place for run settings. TEST_ENV picks config/environments/<name>.env (default "prod").
// Values already in the environment win over the file, so CI and one-off overrides
// (BASE_URL=… npx playwright test) keep working.

const ENVIRONMENTS = ["prod", "local"] as const;
export type TestEnv = (typeof ENVIRONMENTS)[number];

function pickEnv(value: string | undefined): TestEnv {
  const name = value ?? "prod";
  if (!(ENVIRONMENTS as readonly string[]).includes(name)) {
    throw new Error(`TEST_ENV must be one of ${ENVIRONMENTS.join(", ")}, got "${name}"`);
  }
  return name as TestEnv;
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer, got "${raw}"`);
  return value;
}

function url(name: string): string {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is not set (check config/environments/${testEnv}.env)`);
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} is not a valid URL: "${raw}"`);
  }
}

const testEnv = pickEnv(process.env.TEST_ENV);
const file = fileURLToPath(new URL(`./environments/${testEnv}.env`, import.meta.url));
if (existsSync(file)) process.loadEnvFile(file);

export const env = Object.freeze({
  name: testEnv,
  baseUrl: url("BASE_URL"),
  isCI: !!process.env.CI,
  /** Parallel workers. Undefined locally lets Playwright use half the CPU cores. */
  workers: process.env.CI || process.env.WORKERS ? positiveInt("WORKERS", 2) : undefined,
  testTimeoutMs: positiveInt("TEST_TIMEOUT_MS", 30_000),
  expectTimeoutMs: positiveInt("EXPECT_TIMEOUT_MS", 5_000),
});
