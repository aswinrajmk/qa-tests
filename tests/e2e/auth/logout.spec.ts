import { expect, test } from "../../../src/fixtures/index.ts";

test("signs out and returns to the login page", { tag: "@REQ-2" }, async ({ signedIn }) => {
  await signedIn.signOut();
  await expect(signedIn.page).toHaveURL(/\/login$/);
  await expect(signedIn.page.getByRole("heading", { level: 1 })).toHaveText("Sign in to your portfolio");
});
