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

/**
 * Drops fixtures a test destructures but never uses (`async ({ signedIn, loginPage }) =>`), the lint error small
 * models make most. Each test is checked against its own body, up to the next test or the end of the file.
 */
export function dropUnusedFixtures(code: string): string {
  const head = /async\s*\(\{([^}]*)\}\)\s*=>\s*\{/g;
  const matches = [...code.matchAll(head)];
  let out = "";
  let last = 0;
  matches.forEach((m, i) => {
    const start = m.index ?? 0;
    const bodyEnd = matches[i + 1]?.index ?? code.length;
    const body = code.slice(start + m[0].length, bodyEnd);
    const names = (m[1] ?? "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const used = names.filter((n) => new RegExp(`\\b${n}\\b`).test(body));
    out +=
      code.slice(last, start) + m[0].replace(m[1] ?? "", ` ${(used.length ? used : names.slice(0, 1)).join(", ")} `);
    last = start + m[0].length;
  });
  return out + code.slice(last);
}
