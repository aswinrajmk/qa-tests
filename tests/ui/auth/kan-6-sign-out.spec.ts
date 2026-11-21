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
});
