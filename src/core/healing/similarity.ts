// Text similarity for the last-resort healing strategy. Pure functions, unit-tested in tests/unit.

// Labels that mean the same action in UI copy. Matching is case- and space-insensitive.
const SYNONYMS: string[][] = [
  ["sign in", "log in", "login", "signin", "log on"],
  ["sign out", "log out", "logout", "signout"],
  ["submit", "send", "continue"],
];

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function bigrams(text: string): string[] {
  const s = normalise(text).replace(/ /g, "");
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

/** Dice coefficient over character bigrams, from 0 (nothing shared) to 1 (identical). */
export function dice(a: string, b: string): number {
  const x = bigrams(a);
  const y = bigrams(b);
  if (x.length === 0 || y.length === 0) return normalise(a) === normalise(b) ? 1 : 0;
  const counts = new Map<string, number>();
  for (const g of x) counts.set(g, (counts.get(g) ?? 0) + 1);
  let shared = 0;
  for (const g of y) {
    const n = counts.get(g) ?? 0;
    if (n > 0) {
      shared++;
      counts.set(g, n - 1);
    }
  }
  return (2 * shared) / (x.length + y.length);
}

export function areSynonyms(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  return SYNONYMS.some((group) => group.includes(na) && group.includes(nb));
}

/** Similarity used to rank candidates: synonyms count as a full match. */
export function similarity(expected: string, actual: string): number {
  return areSynonyms(expected, actual) ? 1 : dice(expected, actual);
}

/** Picks the single best label at or above the threshold, or null when none qualifies or there is a tie. */
export function bestMatch(
  expected: string,
  labels: string[],
  threshold = 0.6,
): { index: number; score: number } | null {
  let best: { index: number; score: number } | null = null;
  let tie = false;
  labels.forEach((label, index) => {
    const score = similarity(expected, label);
    if (score < threshold) return;
    if (!best || score > best.score) {
      best = { index, score };
      tie = false;
    } else if (score === best.score) {
      tie = true;
    }
  });
  return tie ? null : best;
}

/** Playwright locator source a person would write for the element that was actually found. */
export function suggestLocator(role: string | null, name: string): string {
  const quoted = `'${name.replace(/'/g, "\\'")}'`;
  return role ? `getByRole('${role}', { name: ${quoted} })` : `getByText(${quoted})`;
}
