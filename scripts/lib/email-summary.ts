// Renders a Playwright JSON report as an HTML email that reads well in Gmail and Outlook: tables and inline
// styles only, no scripts. scripts/report/email-summary.ts does the file I/O; this stays pure for unit tests.

interface JsonAttachment {
  name: string;
  body?: string;
}
interface JsonResult {
  status: string;
  duration: number;
  errors?: { message?: string }[];
  attachments?: JsonAttachment[];
}
interface JsonTest {
  status: "expected" | "unexpected" | "flaky" | "skipped";
  results: JsonResult[];
}
interface JsonSpec {
  title: string;
  tags: string[];
  file: string;
  tests: JsonTest[];
}
export interface JsonSuite {
  title: string;
  specs?: JsonSpec[];
  suites?: JsonSuite[];
}
export interface JsonReport {
  suites: JsonSuite[];
  stats: { startTime: string; duration: number };
}

export interface RunContext {
  suite: string; // "smoke" | "regression"
  app: string; // "wealthlite"
  appSha?: string;
  appMessage?: string;
  reportUrl: string;
  dashboardUrl: string;
  ciUrl: string;
}

export type Outcome = "passed" | "failed" | "healed" | "skipped";

export interface TestRow {
  describe: string;
  title: string;
  file: string;
  story: string | null;
  keys: string[];
  outcome: Outcome;
  durationMs: number;
  error?: string;
  healing?: { element: string; broken: string; suggestion: string };
}

const JIRA = /^KAN-\d+$/;

/** One row per test, with the describe title, Jira keys and a final outcome (healed beats passed). */
export function collect(report: JsonReport): TestRow[] {
  const rows: TestRow[] = [];
  const walk = (suite: JsonSuite, describes: string[], isFile: boolean) => {
    const path = isFile ? describes : [...describes, suite.title];
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const last = test.results.at(-1);
        const keys = spec.tags.filter((t) => JIRA.test(t));
        const healingRaw = last?.attachments?.find((a) => a.name === "healing")?.body;
        let healing: TestRow["healing"];
        if (healingRaw) {
          try {
            healing = JSON.parse(Buffer.from(healingRaw, "base64").toString("utf8")) as TestRow["healing"];
          } catch {
            healing = undefined;
          }
        }
        let outcome: Outcome = "passed";
        if (test.status === "skipped") outcome = "skipped";
        else if (test.status === "unexpected") outcome = "failed";
        else if (healing) outcome = "healed";
        rows.push({
          describe: path.join(" › "),
          title: spec.title,
          file: spec.file,
          story: keys[0] ?? null,
          keys,
          outcome,
          durationMs: test.results.reduce((sum, r) => sum + r.duration, 0),
          error: outcome === "failed" ? firstLines(last?.errors?.[0]?.message ?? "", 6) : undefined,
          healing,
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, path, false);
  };
  for (const file of report.suites) walk(file, [], true);
  return rows;
}

// Strip ANSI colour codes Playwright puts in error messages, and keep the start.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
function firstLines(text: string, n: number): string {
  return text.replace(ANSI, "").split("\n").slice(0, n).join("\n").trim();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const COLOR: Record<Outcome, string> = { passed: "#1a7f37", failed: "#cf222e", healed: "#9a6700", skipped: "#57606a" };
const ICON: Record<Outcome, string> = { passed: "✅", failed: "❌", healed: "🩹", skipped: "⏭" };

// Times in the email are India Standard Time, like the dashboard. Intl names the zone "GMT+5:30", so the label is
// added by hand.
const IST = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
export const formatIst = (iso: string) => `${IST.format(new Date(iso))} IST`;

const seconds = (ms: number) => (ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms / 60_000)} min`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function renderEmail(report: JsonReport, ctx: RunContext): { subject: string; html: string } {
  const rows = collect(report);
  const count = (o: Outcome) => rows.filter((r) => r.outcome === o).length;
  const failed = count("failed");
  const ran = rows.length - count("skipped");
  const ok = ran - failed;
  const verdict = failed ? "failed" : "passed";
  const sha = ctx.appSha ? ctx.appSha.slice(0, 7) : "";
  const subject = `${failed ? "❌" : "✅"} ${cap(ctx.suite)} ${verdict} ${ok}/${ran} · ${ctx.app}${sha ? ` ${sha}` : ""}`;

  const cell = "padding:6px 8px;border-bottom:1px solid #d0d7de;font-size:14px;vertical-align:top;";
  const badge = (o: Outcome) =>
    `<span style="color:${COLOR[o]};font-weight:600;white-space:nowrap">${ICON[o]} ${cap(o)}</span>`;
  const keys = (r: TestRow) =>
    r.keys.length ? `<div style="color:#57606a;font-size:12px">${r.keys.map((k) => `@${k}`).join(" ")}</div>` : "";

  const failures = rows
    .filter((r) => r.outcome === "failed")
    .map(
      (r) => `<tr><td style="${cell}"><strong>${esc(r.title)}</strong>${keys(r)}
        <pre style="margin:6px 0 0;padding:8px;background:#f6f8fa;border-radius:6px;font-size:12px;white-space:pre-wrap;color:#24292f">${esc(r.error ?? "")}</pre></td></tr>`,
    )
    .join("");
  const healed = rows
    .filter((r) => r.outcome === "healed" && r.healing)
    .map(
      (r) => `<tr><td style="${cell}"><strong>${esc(r.title)}</strong>${keys(r)}
        <div style="font-size:13px;margin-top:4px">${esc(r.healing?.element ?? "")}: <code>${esc(r.healing?.broken ?? "")}</code> broke.
        Suggested fix: <code>${esc(r.healing?.suggestion ?? "")}</code></div></td></tr>`,
    )
    .join("");

  const groups = new Map<string, TestRow[]>();
  for (const r of rows) {
    const key = r.story ? `${r.story} · ${r.describe}` : r.describe || r.file;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const all = [...groups.entries()]
    .map(
      ([group, list]) =>
        `<tr><td colspan="3" style="${cell}background:#f6f8fa;font-weight:600">${esc(group)}</td></tr>` +
        list
          .map(
            (r) =>
              `<tr><td style="${cell}">${esc(r.title)}</td><td style="${cell}">${badge(r.outcome)}</td><td style="${cell}text-align:right;white-space:nowrap">${seconds(r.durationMs)}</td></tr>`,
          )
          .join(""),
    )
    .join("");

  const button = (label: string, href: string, primary = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;${primary ? "background:#0969da;color:#ffffff" : "background:#f6f8fa;color:#0969da;border:1px solid #d0d7de"}">${esc(label)}</a>`;
  const section = (title: string, body: string) =>
    body
      ? `<h2 style="font-size:16px;margin:24px 0 8px">${title}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table>`
      : "";
  const tile = (label: string, value: number, o: Outcome) =>
    `<td style="padding:10px;text-align:center;border:1px solid #d0d7de;border-radius:6px"><div style="font-size:22px;font-weight:700;color:${COLOR[o]}">${value}</div><div style="font-size:12px;color:#57606a">${label}</div></td>`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff"><tr><td align="center" style="padding:16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#24292f;text-align:left">
<tr><td>
  <h1 style="font-size:20px;margin:0 0 4px">${failed ? "❌" : "✅"} ${esc(cap(ctx.suite))} suite ${verdict}: ${ok}/${ran}</h1>
  <p style="margin:0 0 16px;color:#57606a;font-size:14px">${esc(ctx.app)}${sha ? ` at <code>${esc(sha)}</code>` : ""}${ctx.appMessage ? ` · ${esc(ctx.appMessage.split("\n")[0] ?? "")}` : ""} · ${seconds(report.stats.duration)} · ${esc(formatIst(report.stats.startTime))}</p>
  <table role="presentation" width="100%" cellspacing="6" cellpadding="0"><tr>
    ${tile("Passed", count("passed"), "passed")}${tile("Failed", failed, "failed")}${tile("Healed", count("healed"), "healed")}${tile("Skipped", count("skipped"), "skipped")}
  </tr></table>
  <p style="margin:16px 0 0">${button("Full Playwright report", ctx.reportUrl, true)}${button("Dashboard", ctx.dashboardUrl)}${button("CI run log", ctx.ciUrl)}</p>
  ${section("Failed tests", failures)}
  ${section("Healed locators to fix", healed)}
  ${section("All tests by story", all)}
  <p style="margin:24px 0 0;color:#57606a;font-size:12px">Sent by qa-tests after the ${esc(ctx.suite)} suite ran in GitHub Actions. Healed tests passed only because a fallback locator was used.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}
