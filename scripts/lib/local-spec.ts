// Turns a local model's reply into a spec file path and contents. Kept pure so it is unit tested
// (tests/unit/local-spec.test.ts); scripts/jira/write-local-spec.ts does the file I/O.

const FEATURE = /^[a-z0-9][a-z0-9-]{0,29}$/;
const KEY = /^KAN-\d{1,6}$/;

/** Where the local draft goes: one new file per approval, so it never overwrites a reviewed spec. */
export function specPath(story: string, firstTest: string, feature: string): string {
  if (!KEY.test(story) || !KEY.test(firstTest)) throw new Error(`Bad Jira keys: ${story}, ${firstTest}`);
  const folder = FEATURE.test(feature) ? feature : "stories";
  return `tests/ui/${folder}/${story.toLowerCase()}-${firstTest.toLowerCase()}.spec.ts`;
}

/** The code inside the first ```ts / ```typescript fence, or the whole reply when there is no fence. */
export function extractCode(reply: string): string {
  const fenced = /```(?:ts|typescript|tsx|js|javascript)?[^\n]*\n([\s\S]*?)```/.exec(reply);
  const code = (fenced?.[1] ?? reply).trim();
  if (!/\btest(\.describe)?\s*\(/.test(code)) throw new Error("The local model's reply contains no Playwright test");
  if (code.length > 30_000) throw new Error("The local model's reply is too long to be a single spec");
  return code + "\n";
}
