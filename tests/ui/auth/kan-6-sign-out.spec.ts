import { expect, test } from "../../../src/fixtures/index.ts";

test.describe("Sign out from the portfolio page", { tag: "@KAN-6" }, () => {
  test(
    "returns to the login page and stops showing holdings",
    { tag: ["@KAN-8", "@smoke"] },
    async ({ signedIn, loginPage }) => {
      await test.step("Start signed in on the portfolio page", async () => {
        await expect(signedIn.page).toHaveURL(/\/portfolio$/);
        await expect(signedIn.holdings.root).toBeVisible();
      });

      await test.step("Click the Sign out button in the portfolio header", () => signedIn.header.signOut());

      await test.step("The address bar changes from /portfolio to /login", async () => {
        await expect(signedIn.page).toHaveURL(/\/login$/);
        await expect(loginPage.heading()).toHaveText("Sign in to your portfolio");
      });

      await test.step("Holdings are no longer accessible", async () => {
        await expect(signedIn.holdings.root).toBeHidden();
      });
    },
  );

  test(
    "sends a signed-out visitor who opens the portfolio URL to the login page",
    { tag: ["@KAN-7", "@smoke"] },
    async ({ signedIn, portfolioPage, loginPage }) => {
      await test.step("Sign out from the portfolio page", async () => {
        await signedIn.header.signOut();
        await expect(signedIn.page).toHaveURL(/\/login$/);
      });

      await test.step("Open the portfolio route directly in the address bar", () => portfolioPage.goto());

      await test.step("A login prompt appears instead of the portfolio", async () => {
        await expect(portfolioPage.page).toHaveURL(/\/login$/);
        await expect(loginPage.heading()).toHaveText("Sign in to your portfolio");
        await expect(loginPage.email()).toBeVisible();
      });

      await test.step("No holdings data is shown", async () => {
        await expect(portfolioPage.holdings.root).toBeHidden();
        await expect(portfolioPage.totalValue()).toBeHidden();
      });
    },
  );
});
