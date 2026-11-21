// Governance gate: every Playwright test must trace to a Jira story and Test issue and belong to one suite.
// Lists the tests without running them, so it is fast and needs no browser or network.
// Usage: npm run check:tags

import { execFileSync } from "node:child_process";
import { checkAll, type ListedTest } from "./lib/tag-rules.ts";

interface JsonSpec {
  title: string;
  file: string;
  line: number;
  tags: string[];
}
interface JsonSuite {
  specs?: JsonSpec[];
  suites?: JsonSuite[];
}

function collect(suite: JsonSuite, out: ListedTest[]): void {
  for (const spec of suite.specs ?? []) {
    out.push({ title: spec.title, location: `tests/${spec.file}:${spec.line}`, tags: spec.tags });
  }
  for (const child of suite.suites ?? []) collect(child, out);
}

const raw = execFileSync("npx", ["playwright", "test", "--list", "--reporter=json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const report = JSON.parse(raw) as { suites: JsonSuite[]; errors: { message?: string }[] };
if (report.errors.length) {
  console.error(report.errors.map((e) => e.message).join("\n"));
  process.exit(1);
}

const tests: ListedTest[] = [];
for (const suite of report.suites) collect(suite, tests);
const errors = checkAll(tests);

if (errors.length) {
  console.error(`Tag check failed for ${errors.length} problem(s). See docs/CONVENTIONS.md#tagging.\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`Tag check passed: ${tests.length} tests, each traced to a Jira story and Test issue.`);
