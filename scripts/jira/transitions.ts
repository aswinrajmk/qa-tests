// The automation states a story's Test issues move through, kept free of I/O so they can be unit tested.
//
//   pr-open  : auto-queued                → auto-pr-open   (the PR link is commented on the story)
//   unchanged: auto-queued                → automated      (the tests in main already match)
//   failed   : auto-queued                → auto-failed    (remove auto-failed in Jira to retry)
//   merged   : auto-queued | auto-pr-open → automated
//
// `merged` also accepts auto-queued: a PR can be merged while a later run for the same story is still in flight,
// with its tests still auto-queued. A merge is final, so it always wins.

export const TRANSITIONS = {
  "pr-open": { from: ["auto-queued"], to: "auto-pr-open", say: "Automated tests are in review: " },
  unchanged: {
    from: ["auto-queued"],
    to: "automated",
    say: "The automated tests in qa-tests already match these Test issues, so nothing changed. Log: ",
  },
  failed: {
    from: ["auto-queued"],
    to: "auto-failed",
    say: "Automating the tests failed. Remove the auto-failed label on a Test issue to retry, and pick Claude or the local model in Telegram. Log: ",
  },
  merged: { from: ["auto-queued", "auto-pr-open"], to: "automated", say: "Automated tests merged into qa-tests: " },
} as const;

export type Step = keyof typeof TRANSITIONS;

export const isStep = (s: string): s is Step => Object.hasOwn(TRANSITIONS, s);

/** The state labels a Test issue carries that the step should replace with its target label. */
export function labelsToReplace(step: Step, labels: readonly string[]): string[] {
  const from: readonly string[] = TRANSITIONS[step].from;
  return labels.filter((l) => from.includes(l));
}

/** JQL for the given Test issues that are in one of the step's starting states. */
export function jqlFor(step: Step, keys: readonly string[]): string {
  const from = TRANSITIONS[step].from.map((l) => `"${l}"`).join(", ");
  return `key in (${keys.join(",")}) AND labels in (${from})`;
}
