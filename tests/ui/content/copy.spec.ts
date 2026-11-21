import AxeBuilder from "@axe-core/playwright";
import { DEMO_USER } from "../../../src/data/users.ts";
import { expect, test } from "../../../src/fixtures/index.ts";

// Copy checks assert exact text on purpose. A renamed button heals in the flow tests,
// but this test still fails, so a copy change is always reported.
test.describe("Login page content", { tag: "@KAN-10" }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('sign-in button reads "Sign in"', { tag: ["@KAN-14", "@smoke"] }, async ({ page }) => {
    await expect(page.getByTestId("login-submit")).toHaveText("Sign in");
  });

  test("shows the heading and the demo account hint", { tag: ["@KAN-15", "@regression"] }, async ({ loginPage }) => {
    await expect(loginPage.heading()).toHaveText("Sign in to your portfolio");
    await expect(loginPage.page.getByText(DEMO_USER.email, { exact: true })).toBeVisible();
  });

  test("has no serious accessibility violations", { tag: ["@KAN-16", "@regression"] }, async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const serious = results.violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.help}`);
    expect(serious).toEqual([]);
  });
});
