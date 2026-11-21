import { parseGbp } from "../../../src/data/money.ts";
import { expect, test } from "../../../src/fixtures/index.ts";

test.describe("Portfolio", { tag: "@KAN-19" }, () => {
  test("shows the signed-in user's five holdings", { tag: ["@KAN-20", "@smoke"] }, async ({ signedIn }) => {
    await expect(signedIn.holdings.root).toBeVisible();
    await expect(signedIn.holdings.rows()).toHaveCount(5);
  });

  test("total value equals the sum of the holdings", { tag: ["@KAN-21", "@regression"] }, async ({ signedIn }) => {
    await expect(signedIn.holdings.values()).toHaveCount(5);
    const values = (await signedIn.holdings.values().allInnerTexts()).map(parseGbp);
    const total = parseGbp(await signedIn.totalValue().innerText());
    expect(total).toBe(values.reduce((sum, v) => sum + v, 0));
  });

  test("redirects to login when not signed in", { tag: ["@KAN-22", "@regression"] }, async ({ portfolioPage }) => {
    await portfolioPage.goto();
    await expect(portfolioPage.page).toHaveURL(/\/login$/);
  });
});
