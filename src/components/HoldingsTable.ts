import type { Locator } from "@playwright/test";
import type { Healer } from "../core/healing/heal.ts";
import { parseGbp } from "../data/money.ts";

/** Direction the "Value" column can be sorted in, matching the aria-sort values a sortable table uses. */
export type SortDirection = "ascending" | "descending";

/** The "Your holdings" table. A component takes its root locator, so it works wherever the table is placed. */
export class HoldingsTable {
  constructor(
    readonly root: Locator,
    private readonly heal: Healer,
  ) {}

  /** Data rows only (rows with a row header), not the header or footer rows. */
  readonly rows = () => this.root.getByRole("row").filter({ has: this.root.page().getByRole("rowheader") });
  readonly values = () => this.root.getByTestId("holding-value");

  /** The "Value" column header cell, which carries the sort arrows and the current sort state. */
  readonly valueHeader = () => this.root.getByRole("columnheader", { name: "Value" });

  /** The money amounts as the UI formats them, in the order the rows are shown. */
  valueTexts(): Promise<string[]> {
    return this.values().allInnerTexts();
  }

  /** The money amounts in pence, in the order the rows are shown. */
  async valuesInPence(): Promise<number[]> {
    return (await this.valueTexts()).map(parseGbp);
  }

  /** Clicks the up or down arrow next to "Value" to sort the table by that column. */
  async sortByValue(direction: SortDirection): Promise<void> {
    const arrow = await this.valueSortArrow(direction);
    await arrow.click();
  }

  /**
   * The arrow control that sorts "Value" one way. The arrows are new UI whose labels are likely to be
   * reworded, so they go through the healer with a test id fallback.
   */
  private valueSortArrow(direction: SortDirection): Promise<Locator> {
    const name = direction === "descending" ? "Sort by value descending" : "Sort by value ascending";
    const testId = direction === "descending" ? "sort-value-desc" : "sort-value-asc";
    return this.heal.locate({
      element: `Value column ${direction} sort arrow`,
      primary: {
        description: `getByRole('button', { name: '${name}' })`,
        locate: () => this.valueHeader().getByRole("button", { name }),
      },
      fallbacks: [{ description: `getByTestId('${testId}')`, locate: (p) => p.getByTestId(testId) }],
      label: { text: name, role: "button" },
    });
  }
}
