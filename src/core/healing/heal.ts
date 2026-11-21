import { test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { bestMatch, suggestLocator } from "./similarity.ts";

// Self-healing locator.
// 1. Try the primary locator (what the test author meant).
// 2. If it does not resolve to exactly one element, try fallbacks in order.
// 3. If a fallback resolves to exactly one element, continue and record a "healed" attachment with
//    the broken locator, the locator used and a suggested fix. The reporter turns that into the
//    "Healed" status, so healing is never silent.
// 4. If nothing resolves, return the primary locator so the action fails with Playwright's normal error.

export interface Strategy {
  /** How the locator reads in a report, for example "getByTestId('login-submit')". */
  description: string;
  locate: (page: Page) => Locator;
}

export interface HealTarget {
  /** Human name used in reports, for example "Sign in button". */
  element: string;
  primary: Strategy;
  fallbacks?: Strategy[];
  /** Last resort: the visible label the element is expected to have, matched by similarity. */
  label?: { text: string; role: "button" | "link" };
}

export interface HealingRecord {
  element: string;
  broken: string;
  used: string;
  suggestion: string;
}

export const HEALING_ATTACHMENT = "healing";

const PRIMARY_TIMEOUT_MS = 3_000;
const FALLBACK_TIMEOUT_MS = 1_000;

async function resolvesToOne(locator: Locator, timeout: number): Promise<boolean> {
  try {
    await locator.first().waitFor({ state: "attached", timeout });
    return (await locator.count()) === 1;
  } catch {
    return false;
  }
}

async function describeFound(locator: Locator): Promise<{ role: string | null; name: string }> {
  return locator.evaluate((el) => {
    const tag = el.tagName.toLowerCase();
    const role =
      el.getAttribute("role") ??
      (tag === "button" || (tag === "input" && ["submit", "button"].includes((el as HTMLInputElement).type))
        ? "button"
        : tag === "a" && el.hasAttribute("href")
          ? "link"
          : null);
    const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
    return { role, name };
  });
}

export class Healer {
  readonly records: HealingRecord[] = [];

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /** Runs as one named step, so the internal lookup attempts do not show up as failed steps in reports. */
  locate(target: HealTarget): Promise<Locator> {
    return test.step(`Find ${target.element} (self-healing)`, () => this.resolve(target), { box: true });
  }

  private async resolve(target: HealTarget): Promise<Locator> {
    const primary = target.primary.locate(this.page);
    if (await resolvesToOne(primary, PRIMARY_TIMEOUT_MS)) return primary;

    for (const fallback of target.fallbacks ?? []) {
      const candidate = fallback.locate(this.page);
      if (await resolvesToOne(candidate, FALLBACK_TIMEOUT_MS)) {
        return this.healed(target, candidate, fallback.description);
      }
    }

    if (target.label) {
      const all = this.page.getByRole(target.label.role);
      const labels = (await all.allInnerTexts()).map((t) => t.trim());
      const match = bestMatch(target.label.text, labels);
      if (match) {
        const candidate = all.nth(match.index);
        const description = `getByRole('${target.label.role}') nearest to '${target.label.text}' (score ${match.score.toFixed(2)})`;
        return this.healed(target, candidate, description);
      }
    }

    await this.testInfo.attach("heal-log", {
      body: `[heal] ${target.element}: no strategy matched exactly one element`,
      contentType: "text/plain",
    });
    return primary;
  }

  private async healed(target: HealTarget, found: Locator, used: string): Promise<Locator> {
    const { role, name } = await describeFound(found);
    const record: HealingRecord = {
      element: target.element,
      broken: target.primary.description,
      used,
      suggestion: suggestLocator(role, name),
    };
    this.records.push(record);
    await this.testInfo.attach(HEALING_ATTACHMENT, { body: JSON.stringify(record), contentType: "application/json" });
    console.warn(
      `[heal] ${record.element}: ${record.broken} failed, used ${record.used}. Suggested: ${record.suggestion}`,
    );
    return found;
  }
}
