/** Parses a GBP amount as shown in the UI, for example "£62,386.20", into pence. */
export function parseGbp(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  return Math.round(Number(cleaned) * 100);
}

/** Array#sort comparator that orders GBP amounts as shown in the UI, largest first. */
export function byGbpDescending(a: string, b: string): number {
  return parseGbp(b) - parseGbp(a);
}

/** Array#sort comparator that orders GBP amounts as shown in the UI, smallest first. */
export function byGbpAscending(a: string, b: string): number {
  return parseGbp(a) - parseGbp(b);
}

/** The largest of the given GBP amounts, returned exactly as the UI wrote it. */
export function largestGbp(texts: readonly string[]): string {
  return extremeGbp(texts, byGbpDescending);
}

/** The smallest of the given GBP amounts, returned exactly as the UI wrote it. */
export function smallestGbp(texts: readonly string[]): string {
  return extremeGbp(texts, byGbpAscending);
}

function extremeGbp(texts: readonly string[], order: (a: string, b: string) => number): string {
  if (texts.length === 0) throw new Error("No GBP amounts to compare");
  return texts.reduce((best, text) => (order(text, best) < 0 ? text : best));
}
