// Moves a story's Test issues to the next automation state, and comments on the story.
// Usage: node scripts/jira/transition.ts <KAN-6> <pr-open|unchanged|failed|merged> [url]
// The states are described in transitions.ts.
//
// `merged` exits non-zero when it moves no Test issue, so a merge that leaves Jira behind fails visibly in Actions
// instead of passing with "for none".

import { adfParagraph } from "./adf.ts";
import { Jira, STORY_KEY } from "./client.ts";
import { isStep, jqlFor, labelsToReplace, TRANSITIONS } from "./transitions.ts";

const [story = "", step = "", url] = process.argv.slice(2);
if (!STORY_KEY.test(story)) throw new Error(`Expected a story key like KAN-6, got "${story}"`);
if (!isStep(step)) throw new Error(`Step must be one of ${Object.keys(TRANSITIONS).join(", ")}`);
if (url && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(pull|actions\/runs)\/\d+$/.test(url)) {
  throw new Error(`Unexpected link "${url}"`);
}

const { from, to, say } = TRANSITIONS[step];
const jira = new Jira();
const keys = await jira.linkedTests(story);
const tests = keys.length ? await jira.search(jqlFor(step, keys), ["labels"]) : [];
for (const t of tests) {
  for (const label of labelsToReplace(step, t.fields.labels)) await jira.swapLabel(t.key, label, to);
}
const moved = tests.map((t) => t.key).join(", ") || "none";
console.log(`${story}: ${from.join(" | ")} → ${to} for ${moved}`);

if (step === "merged" && tests.length === 0) {
  console.error(
    `::error::No Test issue of ${story} was ${from.join(" or ")}, so none was marked ${to}. ` +
      `Check the labels in Jira, then rerun: node scripts/jira/transition.ts ${story} merged <PR url>`,
  );
  process.exit(1);
}
await jira.comment(story, adfParagraph(`${say}${url ? "" : "(no link)"}`, url ? { text: url, href: url } : undefined));
