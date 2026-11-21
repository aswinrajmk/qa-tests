import type { Page } from "@playwright/test";
import type { Healer } from "./healing/heal.ts";

/**
 * Every page object extends this. It owns the Playwright page and the healer, and knows its own route,
 * so tests never build URLs themselves.
 */
export abstract class BasePage {
  /** Route relative to BASE_URL, for example "/login". */
  protected abstract readonly path: string;

  constructor(
    readonly page: Page,
    protected readonly heal: Healer,
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** True when the browser is on this page's route (ignores query and hash). */
  isCurrent(): boolean {
    return new URL(this.page.url()).pathname === this.path;
  }
}
