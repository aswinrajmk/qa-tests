import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../../../src/fixtures/index.ts";

// Copy checks assert exact text on purpose. A renamed button heals in the flow tests,
// but this test still fails, so a copy change is always reported.
test.describe("Login page content", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('sign-in button reads "Sign in"', async ({ page }) => {
    await expect(page.getByTestId("login-submit")).toHaveText("Sign in");
  });

  test("shows the heading and the demo account hint", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to your portfolio");
    await expect(page.getByText("demo@wealthlite.test", { exact: true })).toBeVisible();
  });

  test("has no serious accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.help}`);
    expect(serious).toEqual([]);
  });
});
