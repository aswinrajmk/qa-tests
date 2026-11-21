import { expect } from "@playwright/test";
import { ApiClient } from "../api/ApiClient.ts";
import { AuthApi } from "../api/endpoints/AuthApi.ts";
import { DEMO_USER } from "../data/users.ts";
import type { PortfolioPage } from "../pages/PortfolioPage.ts";
import { test as pages } from "./pages.fixture.ts";

export interface AuthFixtures {
  /** A page that is already signed in through the API, so portfolio tests do not depend on the login UI. */
  signedIn: PortfolioPage;
}

export const test = pages.extend<AuthFixtures>({
  signedIn: async ({ page, portfolioPage }, use) => {
    // page.request shares the browser's cookies, so the API sign-in signs the page in too.
    const response = await new AuthApi(new ApiClient(page.request)).login(DEMO_USER);
    expect(response.ok(), "API sign-in for test setup").toBeTruthy();
    await portfolioPage.goto();
    await expect(portfolioPage.greeting()).toBeVisible();
    await use(portfolioPage);
  },
});
