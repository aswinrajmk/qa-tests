import type { Locator } from "@playwright/test";

/** The "Your holdings" table. A component takes its root locator, so it works wherever the table is placed. */
export class HoldingsTable {
  constructor(readonly root: Locator) {}

  /** Data rows only (rows with a row header), not the header or footer rows. */
  readonly rows = () => this.root.getByRole("row").filter({ has: this.root.page().getByRole("rowheader") });
  readonly values = () => this.root.getByTestId("holding-value");
}
