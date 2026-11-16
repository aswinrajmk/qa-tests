import { expect, test } from "../../../src/fixtures/index.ts";
import { parseGbp } from "../../../src/pages/PortfolioPage.ts";

test.describe("Portfolio", () => {
  test("shows the signed-in user's five holdings", async ({ signedIn }) => {
    await expect(signedIn.holdingsTable()).toBeVisible();
    await expect(signedIn.rows()).toHaveCount(5);
  });

  test("total value equals the sum of the holdings", async ({ signedIn }) => {
    await expect(signedIn.holdingValues()).toHaveCount(5);
    const values = (await signedIn.holdingValues().allInnerTexts()).map(parseGbp);
    const total = parseGbp(await signedIn.totalValue().innerText());
    expect(total).toBe(values.reduce((sum, v) => sum + v, 0));
  });

  test("redirects to login when not signed in", async ({ portfolioPage }) => {
    await portfolioPage.goto();
    await expect(portfolioPage.page).toHaveURL(/\/login$/);
  });
});
