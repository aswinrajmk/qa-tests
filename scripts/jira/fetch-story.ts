// Writes .jira-story.md for the AI agent: a story and only its Test issues labelled for a suite.
// Usage: node scripts/jira/fetch-story.ts KAN-6
// Also prints `tests=KAN-7,KAN-8` and `title=…` to $GITHUB_OUTPUT when it is set.

import { appendFileSync, writeFileSync } from "node:fs";
import { adfToText } from "./adf.ts";
import { Jira, STORY_KEY, SUITE_LABELS } from "./client.ts";

const story = process.argv[2] ?? "";
if (!STORY_KEY.test(story)) throw new Error(`Expected a story key like KAN-6, got "${story}"`);

const jira = new Jira();
const issue = await jira.issue(story, ["summary", "description", "issuetype"]);
if (issue.fields.issuetype?.name !== "Story")
  throw new Error(`${story} is a ${issue.fields.issuetype?.name}, not a Story`);

const keys = await jira.linkedTests(story);
const tests = keys.length
  ? await jira.search(`key in (${keys.join(",")}) AND labels in (${SUITE_LABELS.join(",")}) ORDER BY key ASC`, [
      "summary",
      "description",
      "labels",
    ])
  : [];

// Smoke is a subset of regression, so a test labelled both belongs to smoke.
const suiteOf = (labels: string[]) => (labels.includes("smoke") ? "smoke" : "regression");
const lines = [
  `# Story ${story}: ${issue.fields.summary}`,
  "",
  "Tag the test.describe with `@" + story + "`.",
  "",
  adfToText(issue.fields.description as never) || "(no description)",
  "",
  "## Test issues to automate",
  "",
  "Automate exactly these, one test() each. Each test has two tags: its key and its suite.",
];
for (const t of tests) {
  lines.push(
    "",
    `### ${t.key}: ${t.fields.summary.replace(/^\[KAN-\d+\]\s*/, "")}`,
    "",
    `Tags: \`@${t.key}\`, \`@${suiteOf(t.fields.labels)}\`${t.fields.labels.includes("automated") ? " (already automated: keep it in step with this text)" : ""}`,
    "",
    adfToText(t.fields.description as never) || "(no description)",
  );
}
writeFileSync(".jira-story.md", lines.join("\n") + "\n");
console.log(`Wrote .jira-story.md: ${story} with ${tests.length} labelled Test issue(s) of ${keys.length} linked`);

if (process.env.GITHUB_OUTPUT) {
  const title = issue.fields.summary.replace(/[\r\n]/g, " ").slice(0, 200);
  appendFileSync(process.env.GITHUB_OUTPUT, `tests=${tests.map((t) => t.key).join(",")}\ntitle=${title}\n`);
}
