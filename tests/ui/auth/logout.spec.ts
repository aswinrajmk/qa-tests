import { expect, test } from "../../../src/fixtures/index.ts";

test.describe("Sign out", { tag: "@KAN-17" }, () => {
  test("signs out and returns to the login page", { tag: ["@KAN-18", "@smoke"] }, async ({ signedIn, loginPage }) => {
    await signedIn.header.signOut();
    await expect(loginPage.page).toHaveURL(/\/login$/);
    await expect(loginPage.heading()).toHaveText("Sign in to your portfolio");
  });
});
