import { byGbpAscending, byGbpDescending, largestGbp, smallestGbp } from "../../../src/data/money.ts";
import { expect, test } from "../../../src/fixtures/index.ts";

test.describe("Sort holdings by value", { tag: "@KAN-26" }, () => {
  test(
    "puts the largest holding at the top when the down arrow is clicked",
    { tag: ["@KAN-27", "@regression"] },
    async ({ signedIn }) => {
      let unsorted: string[] = [];

      await test.step("Locate the 'Value' column header", async () => {
        await expect(signedIn.holdings.root).toBeVisible();
        await expect(signedIn.holdings.valueHeader()).toBeVisible();
        await expect(signedIn.holdings.valueSortArrows()).toBeVisible();
        unsorted = await signedIn.holdings.valueTexts();
        expect(unsorted.length, "holdings available to sort").toBeGreaterThan(1);
      });

      await test.step("Click the down arrow icon next to 'Value'", () => signedIn.holdings.sortByValue("descending"));

      await test.step("The first row in the table has the highest value", async () => {
        await expect(signedIn.holdings.values().first()).toHaveText(largestGbp(unsorted));
      });

      await test.step("The remaining rows follow in descending order of value", async () => {
        await expect(signedIn.holdings.values()).toHaveText([...unsorted].sort(byGbpDescending));
        await signedIn.holdings.expectSortedByValue("descending");
      });
    },
  );

  test(
    "puts the smallest holding at the top when the up arrow is clicked",
    { tag: ["@KAN-29", "@regression"] },
    async ({ signedIn }) => {
      let unsorted: string[] = [];

      await test.step("Locate the 'Value' column header", async () => {
        await expect(signedIn.holdings.root).toBeVisible();
        await expect(signedIn.holdings.valueHeader()).toBeVisible();
        await expect(signedIn.holdings.valueSortArrows()).toBeVisible();
        unsorted = await signedIn.holdings.valueTexts();
        expect(unsorted.length, "holdings available to sort").toBeGreaterThan(1);
      });

      await test.step("Click the up arrow icon next to 'Value'", () => signedIn.holdings.sortByValue("ascending"));

      await test.step("The first row in the table has the lowest value", async () => {
        await expect(signedIn.holdings.values().first()).toHaveText(smallestGbp(unsorted));
      });

      await test.step("The remaining rows follow in ascending order of value", async () => {
        await expect(signedIn.holdings.values()).toHaveText([...unsorted].sort(byGbpAscending));
        await signedIn.holdings.expectSortedByValue("ascending");
      });
    },
  );
});
