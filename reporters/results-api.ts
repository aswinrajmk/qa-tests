import { relative } from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";

// Streams results to the portfolio Results API while the suite runs, so the dashboard updates live.
// - onBegin starts a run, onTestEnd posts each result immediately, onEnd finishes the run.
// - Posts go through one sequential queue with retries. If the API is unreachable, the reporter
//   logs a warning and carries on: reporting must never fail or slow down the test run itself.
//
// Environment:
//   RESULTS_API_TOKEN   bearer token (reporter is disabled without it)
//   RESULTS_API_URL     defaults to https://portfolio.aswin-qa.workers.dev
//   QA_TRIGGER          "deploy" or "manual" (default "manual")
//   APP_COMMIT_SHA, APP_COMMIT_MESSAGE, CI_RUN_URL   optional context shown in the report
//   QA_FILTER           the --grep pattern when only part of the suite runs (shown on the report)

type Status = "passed" | "failed" | "healed" | "skipped";

interface Payload {
  title: string;
  file: string;
  status: Status;
  durationMs: number;
  error?: { message: string; stack?: string };
  steps?: { title: string; durationMs: number; failed?: boolean }[];
  healing?: { element: string; broken: string; used: string; suggestion: string };
  logs?: string[];
  tags?: string[];
  screenshot?: string;
}

// Terminal colour codes (ESC [ ... m) from Playwright error messages.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const clean = (s: string | undefined, max: number) => (s ?? "").replace(ANSI, "").slice(0, max);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class ResultsApiReporter implements Reporter {
  private readonly token = process.env.RESULTS_API_TOKEN ?? "";
  private readonly baseUrl = (process.env.RESULTS_API_URL ?? "https://portfolio.aswin-qa.workers.dev").replace(
    /\/$/,
    "",
  );
  private rootDir = process.cwd();
  private runId: Promise<string | null> = Promise.resolve(null);
  private queue: Promise<unknown> = Promise.resolve();
  private disabled = false;

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig, _suite: Suite) {
    this.rootDir = config.rootDir;
    if (!this.token) {
      this.disabled = true;
      console.log("[results-api] RESULTS_API_TOKEN not set, so results are not sent to the dashboard.");
      return;
    }
    const targetUrl = String(config.projects[0]?.use.baseURL ?? "");
    this.runId = this.post<{ id: string }>("/api/runs", {
      project: "wealthlite",
      trigger: process.env.QA_TRIGGER === "deploy" ? "deploy" : "manual",
      targetUrl,
      commitSha: process.env.APP_COMMIT_SHA || undefined,
      commitMessage: clean(process.env.APP_COMMIT_MESSAGE, 300).trim() || undefined,
      ciRunUrl: process.env.CI_RUN_URL || undefined,
      filter: process.env.QA_FILTER?.trim() || undefined,
    }).then((body) => {
      if (body?.id) console.log(`[results-api] Live report: ${this.baseUrl}/dashboard/run/?id=${body.id}`);
      return body?.id ?? null;
    });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.disabled) return;
    // Only the final attempt of a retried test is reported.
    if (result.status !== "passed" && result.status !== "skipped" && result.retry < test.retries) return;
    const payload = this.toPayload(test, result);
    this.enqueue(async () => {
      const id = await this.runId;
      if (id) await this.post(`/api/runs/${id}/results`, payload);
    });
  }

  async onEnd(result: FullResult) {
    if (this.disabled) return;
    this.enqueue(async () => {
      const id = await this.runId;
      if (id)
        await this.post(`/api/runs/${id}/finish`, {
          interrupted: result.status !== "passed" && result.status !== "failed",
        });
    });
    await this.queue;
  }

  private toPayload(test: TestCase, result: TestResult): Payload {
    const attachment = (name: string) => result.attachments.find((a) => a.name === name && a.body);
    const healingBody = attachment("healing")?.body?.toString("utf8");
    const healing = healingBody ? (JSON.parse(healingBody) as Payload["healing"]) : undefined;

    let status: Status;
    if (result.status === "skipped") status = "skipped";
    else if (result.status === "passed") status = healing ? "healed" : "passed";
    else status = "failed";

    const logs = [
      ...(attachment("logs")?.body?.toString("utf8").split("\n") ?? []),
      ...(attachment("heal-log")?.body?.toString("utf8").split("\n") ?? []),
      ...result.stdout.map(String),
      ...result.stderr.map(String),
    ]
      .map((line) => clean(line, 1000).trimEnd())
      .filter(Boolean)
      .slice(0, 200);

    const screenshot = attachment("failure-screenshot")?.body?.toString("base64");
    const error = result.error
      ? {
          message: clean(result.error.message ?? String(result.error.value), 4000),
          stack: clean(result.error.stack, 8000) || undefined,
        }
      : undefined;

    return {
      // titlePath: ["", project, file, ...describes, title]
      title: clean(test.titlePath().slice(3).join(" › "), 300),
      file: relative(this.rootDir, test.location.file),
      status,
      durationMs: Math.max(0, Math.round(result.duration)),
      error,
      steps: flattenSteps(result.steps).slice(0, 100),
      healing: status === "healed" ? healing : undefined,
      logs: logs.length ? logs : undefined,
      // Requirement tags (@REQ-n) link the result to a requirement on the dashboard.
      tags: test.tags.length ? test.tags.slice(0, 20) : undefined,
      screenshot,
    };
  }

  private enqueue(task: () => Promise<void>) {
    this.queue = this.queue.then(task).catch((e: unknown) => console.warn(`[results-api] ${String(e)}`));
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) return (await response.json()) as T;
        const text = await response.text();
        // 4xx means the request itself is wrong; retrying will not help.
        if (response.status < 500) {
          console.warn(`[results-api] ${path} rejected (${response.status}): ${text.slice(0, 200)}`);
          return null;
        }
      } catch (e) {
        if (attempt === 3) console.warn(`[results-api] ${path} failed: ${String(e)}`);
      }
      await sleep(500 * attempt);
    }
    return null;
  }
}

// Top-level user steps (test.step), Playwright actions and assertions. Hooks and fixture setup are left out.
const REPORTED = new Set(["test.step", "pw:api", "expect"]);

function flattenSteps(steps: TestStep[]): { title: string; durationMs: number; failed?: boolean }[] {
  return steps
    .filter((step) => REPORTED.has(step.category))
    .map((step) => ({
      title: clean(step.title, 300),
      durationMs: Math.max(0, Math.round(step.duration)),
      failed: !!step.error,
    }));
}
