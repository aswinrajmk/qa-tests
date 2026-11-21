// Moves a story's Test issues to the next automation state, and comments on the story.
// Usage: node scripts/jira/transition.ts <KAN-6> <pr-open|unchanged|failed|merged> [url]
//
//   pr-open : auto-queued  → auto-pr-open   (the PR link is commented on the story)
//   unchanged: auto-queued → automated      (the tests in main already match)
//   failed  : auto-queued  → auto-failed    (remove auto-failed in Jira to retry)
//   merged  : auto-pr-open → automated

import { adfParagraph } from "./adf.ts";
import { Jira, STORY_KEY } from "./client.ts";

const TRANSITIONS = {
  "pr-open": { from: "auto-queued", to: "auto-pr-open", say: "Automated tests are in review: " },
  unchanged: {
    from: "auto-queued",
    to: "automated",
    say: "The automated tests in qa-tests already match these Test issues, so nothing changed. Log: ",
  },
  failed: {
    from: "auto-queued",
    to: "auto-failed",
    say: "Automating the tests failed. Remove the auto-failed label on a Test issue to retry. Log: ",
  },
  merged: { from: "auto-pr-open", to: "automated", say: "Automated tests merged into qa-tests: " },
} as const;
type Step = keyof typeof TRANSITIONS;

const [story = "", step = "", url] = process.argv.slice(2);
if (!STORY_KEY.test(story)) throw new Error(`Expected a story key like KAN-6, got "${story}"`);
if (!(step in TRANSITIONS)) throw new Error(`Step must be one of ${Object.keys(TRANSITIONS).join(", ")}`);
if (url && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(pull|actions\/runs)\/\d+$/.test(url)) {
  throw new Error(`Unexpected link "${url}"`);
}

const { from, to, say } = TRANSITIONS[step as Step];
const jira = new Jira();
const keys = await jira.linkedTests(story);
const tests = keys.length ? await jira.search(`key in (${keys.join(",")}) AND labels = "${from}"`, ["labels"]) : [];
for (const t of tests) await jira.swapLabel(t.key, from, to);
const moved = tests.map((t) => t.key).join(", ") || "none";
await jira.comment(story, adfParagraph(`${say}${url ? "" : "(no link)"}`, url ? { text: url, href: url } : undefined));
console.log(`${story}: ${from} → ${to} for ${moved}`);
