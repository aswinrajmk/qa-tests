// Builds the run email from Playwright's JSON report.
// Usage: SUITE=smoke REPORT_URL=… DASHBOARD_URL=… CI_RUN_URL=… node scripts/report/email-summary.ts test-results/results.json email.html
// Writes the HTML file and prints `subject=…` and `failed=…` to $GITHUB_OUTPUT when it is set.

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { collect, renderEmail, type JsonReport } from "../lib/email-summary.ts";

const [input = "test-results/results.json", output = "email.html"] = process.argv.slice(2);
const report = JSON.parse(readFileSync(input, "utf8")) as JsonReport;
const env = process.env;
const { subject, html } = renderEmail(report, {
  suite: env.SUITE || "suite",
  app: "wealthlite",
  appSha: env.APP_COMMIT_SHA,
  appMessage: env.APP_COMMIT_MESSAGE,
  reportUrl: env.REPORT_URL ?? "",
  dashboardUrl: env.DASHBOARD_URL ?? "https://portfolio.aswin-qa.workers.dev/dashboard/",
  ciUrl: env.CI_RUN_URL ?? "",
});
writeFileSync(output, html);
const failed = collect(report).filter((r) => r.outcome === "failed").length;
console.log(`${subject} → ${output}`);
if (env.GITHUB_OUTPUT)
  appendFileSync(env.GITHUB_OUTPUT, `subject=${subject.replace(/[\r\n]/g, " ")}\nfailed=${failed}\n`);
