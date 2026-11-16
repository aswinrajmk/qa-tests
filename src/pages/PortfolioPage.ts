import type { Page } from "@playwright/test";
import type { Healer } from "../healing/heal.ts";

export class PortfolioPage {
  constructor(
    readonly page: Page,
    private readonly heal: Healer,
  ) {}

  readonly greeting = () => this.page.getByRole("heading", { level: 1 });
  readonly holdingsTable = () => this.page.getByRole("table", { name: "Your holdings" });
  readonly rows = () =>
    this.holdingsTable()
      .getByRole("row")
      .filter({ has: this.page.getByRole("rowheader") });
  readonly totalValue = () => this.page.getByTestId("total-value");
  readonly holdingValues = () => this.page.getByTestId("holding-value");

  async goto() {
    await this.page.goto("/portfolio");
  }

  async signOut() {
    const button = await this.heal.locate({
      element: "Sign out button",
      primary: {
        description: "getByRole('button', { name: 'Sign out' })",
        locate: (p) => p.getByRole("button", { name: "Sign out", exact: true }),
      },
      fallbacks: [{ description: "getByTestId('sign-out')", locate: (p) => p.getByTestId("sign-out") }],
      label: { text: "Sign out", role: "button" },
    });
    await button.click();
  }
}

/** Parses "£62,386.20" into pence. */
export function parseGbp(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  return Math.round(Number(cleaned) * 100);
}
