import { DEMO_USER, WRONG_PASSWORD } from "../../../src/data/users.ts";
import { expect, test } from "../../../src/fixtures/index.ts";

test.describe("Sign in", { tag: "@KAN-10" }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("signs in with the demo account", { tag: ["@KAN-11", "@smoke"] }, async ({ loginPage, portfolioPage }) => {
    await test.step("Fill and submit the form", () => loginPage.signIn(DEMO_USER.email, DEMO_USER.password));

    await test.step("Land on the portfolio", async () => {
      await expect(portfolioPage.page).toHaveURL(/\/portfolio$/);
      await expect(portfolioPage.greeting()).toHaveText(`Welcome back, ${DEMO_USER.name}`);
    });
  });

  test("shows an error for a wrong password", { tag: ["@KAN-12", "@smoke"] }, async ({ loginPage }) => {
    await test.step("Submit a wrong password", () => loginPage.signIn(DEMO_USER.email, WRONG_PASSWORD));

    await test.step("See the error and stay on login", async () => {
      await expect(loginPage.error()).toHaveText("Email or password is incorrect.");
      await expect(loginPage.page).toHaveURL(/\/login$/);
    });
  });

  test("asks for both fields when the form is empty", { tag: ["@KAN-13", "@smoke"] }, async ({ loginPage }) => {
    await (await loginPage.submitButton()).click();
    await expect(loginPage.error()).toHaveText("Enter your email and password.");
  });
});
