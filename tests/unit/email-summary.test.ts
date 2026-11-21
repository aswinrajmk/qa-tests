import assert from "node:assert/strict";
import { test } from "node:test";
import { collect, formatIst, renderEmail, type JsonReport } from "../../scripts/lib/email-summary.ts";

const healing = Buffer.from(
  JSON.stringify({
    element: "Sign in button",
    broken: "getByRole('button', { name: 'Sign in' })",
    suggestion: "getByRole('button', { name: 'Log in' })",
  }),
).toString("base64");

const report: JsonReport = {
  stats: { startTime: "2026-11-21T07:00:00.000Z", duration: 5200 },
  suites: [
    {
      title: "ui/auth/login.spec.ts",
      suites: [
        {
          title: "Sign in",
          specs: [
            {
              title: "signs in with the demo account",
              tags: ["KAN-10", "KAN-11", "smoke"],
              file: "ui/auth/login.spec.ts",
              tests: [
                {
                  status: "expected",
                  results: [{ status: "passed", duration: 900, attachments: [{ name: "healing", body: healing }] }],
                },
              ],
            },
            {
              title: "shows an error for a wrong password",
              tags: ["KAN-10", "KAN-12", "smoke"],
              file: "ui/auth/login.spec.ts",
              tests: [
                {
                  status: "unexpected",
                  results: [
                    {
                      status: "failed",
                      duration: 1200,
                      errors: [{ message: '\u001b[31mExpected: <b>"x"</b>\u001b[39m\nline 2' }],
                    },
                  ],
                },
              ],
            },
            {
              title: "asks for both fields",
              tags: ["KAN-10", "KAN-13", "smoke"],
              file: "ui/auth/login.spec.ts",
              tests: [{ status: "expected", results: [{ status: "passed", duration: 300 }] }],
            },
          ],
        },
      ],
    },
  ],
};

const ctx = {
  suite: "smoke",
  app: "wealthlite",
  appSha: "abc1234def",
  reportUrl: "https://aswinrajmk.github.io/qa-tests/reports/1-1/",
  dashboardUrl: "https://portfolio.aswin-qa.workers.dev/dashboard/",
  ciUrl: "https://github.com/aswinrajmk/qa-tests/actions/runs/1",
};

test("collects one row per test with story, keys and outcome (healed beats passed)", () => {
  const rows = collect(report);
  assert.deepEqual(
    rows.map((r) => [r.describe, r.story, r.outcome]),
    [
      ["Sign in", "KAN-10", "healed"],
      ["Sign in", "KAN-10", "failed"],
      ["Sign in", "KAN-10", "passed"],
    ],
  );
  assert.equal(rows[1]?.error, 'Expected: <b>"x"</b>\nline 2');
});

test("subject gives the verdict, suite, counts and app commit", () => {
  assert.equal(renderEmail(report, ctx).subject, "❌ Smoke failed 2/3 · wealthlite abc1234");
});

test("html escapes test output and links the full report", () => {
  const { html } = renderEmail(report, ctx);
  assert.ok(html.includes("&lt;b&gt;&quot;x&quot;&lt;/b&gt;"));
  assert.ok(!html.includes('<b>"x"</b>'));
  assert.ok(html.includes('href="https://aswinrajmk.github.io/qa-tests/reports/1-1/"'));
  assert.ok(html.includes("Healed locators to fix"));
  assert.ok(html.includes("getByRole(&#39;button&#39;") || html.includes("getByRole('button'"));
});

test("shows the run time in IST", () => {
  assert.equal(formatIst("2026-11-21T07:00:00.000Z"), "Sat, 21 Nov 2026, 12:30 IST");
  assert.ok(renderEmail(report, ctx).html.includes("Sat, 21 Nov 2026, 12:30 IST"));
});
