import { expect, type Locator } from "@playwright/test";
import type { Healer } from "../core/healing/heal.ts";

/** Direction the "Value" column can be sorted in, matching the `aria-sort` values the header reports. */
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

  /** The up and down arrows shown next to the "Value" label. Decorative, so they have no accessible name. */
  readonly valueSortArrows = () => this.valueHeader().locator(".sort__arrows");

  /** The money amounts as the UI formats them, in the order the rows are shown. */
  valueTexts(): Promise<string[]> {
    return this.values().allInnerTexts();
  }

  /**
   * Sorts the table by "Value" with the header's arrow control.
   *
   * The up and down arrows are one toggle: each activation advances the column to the next sort state,
   * so reaching a given direction takes one or two clicks depending on where the column starts.
   */
  async sortByValue(direction: SortDirection): Promise<void> {
    const control = await this.valueSortControl();
    const header = this.valueHeader();

    for (let click = 0; click < 2; click++) {
      const before = (await header.getAttribute("aria-sort")) ?? "none";
      await control.click();
      await expect(header, "the Value column to change sort state when its arrow is clicked").not.toHaveAttribute(
        "aria-sort",
        before,
      );
      if ((await header.getAttribute("aria-sort")) === direction) return;
    }

    // Not reached in a healthy app: fails with the direction the column ended up in.
    await expect(header).toHaveAttribute("aria-sort", direction);
  }

  /** Asserts the "Value" column reports the given sort direction, which is what its arrows indicate. */
  expectSortedByValue(direction: SortDirection): Promise<void> {
    return expect(this.valueHeader()).toHaveAttribute("aria-sort", direction);
  }

  /**
   * The control that sorts "Value". Its accessible name carries the current sort state ("Value, not sorted"),
   * so it is matched on the stable "Value" part through the healer, with a test id fallback.
   */
  private valueSortControl(): Promise<Locator> {
    return this.heal.locate({
      element: "Value column sort arrows",
      primary: {
        description: "getByRole('button', { name: 'Value' })",
        locate: () => this.valueHeader().getByRole("button", { name: "Value" }),
      },
      fallbacks: [{ description: "getByTestId('sort-value')", locate: (p) => p.getByTestId("sort-value") }],
      label: { text: "Value", role: "button" },
    });
  }
}
