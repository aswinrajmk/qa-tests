import type { Page } from "@playwright/test";
import { AppHeader } from "../components/AppHeader.ts";
import { HoldingsTable } from "../components/HoldingsTable.ts";
import { BasePage } from "../core/BasePage.ts";
import type { Healer } from "../core/healing/heal.ts";

export class PortfolioPage extends BasePage {
  protected readonly path = "/portfolio";
  readonly header: AppHeader;
  readonly holdings: HoldingsTable;

  constructor(page: Page, heal: Healer) {
    super(page, heal);
    this.header = new AppHeader(heal);
    this.holdings = new HoldingsTable(page.getByRole("table", { name: "Your holdings" }), heal);
  }

  readonly greeting = () => this.page.getByRole("heading", { level: 1 });
  readonly totalValue = () => this.page.getByTestId("total-value");
}
