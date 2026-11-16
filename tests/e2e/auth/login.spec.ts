import { DEMO_USER, expect, test } from "../../../src/fixtures/index.ts";

test.describe("Sign in", { tag: "@REQ-1" }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("signs in with the demo account", async ({ loginPage, portfolioPage }) => {
    await test.step("Fill and submit the form", () => loginPage.signIn(DEMO_USER.email, DEMO_USER.password));
    await test.step("Land on the portfolio", async () => {
      await expect(portfolioPage.page).toHaveURL(/\/portfolio$/);
      await expect(portfolioPage.greeting()).toHaveText(`Welcome back, ${DEMO_USER.name}`);
    });
  });

  test("shows an error for a wrong password", async ({ loginPage }) => {
    await test.step("Submit a wrong password", () => loginPage.signIn(DEMO_USER.email, "not-the-password"));
    await test.step("See the error and stay on login", async () => {
      await expect(loginPage.error()).toHaveText("Email or password is incorrect.");
      await expect(loginPage.page).toHaveURL(/\/login$/);
    });
  });

  test("asks for both fields when the form is empty", async ({ loginPage }) => {
    await (await loginPage.submitButton()).click();
    await expect(loginPage.error()).toHaveText("Enter your email and password.");
  });
});
