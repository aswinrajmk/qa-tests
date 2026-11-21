/** Parses a GBP amount as shown in the UI, for example "£62,386.20", into pence. */
export function parseGbp(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  return Math.round(Number(cleaned) * 100);
}
