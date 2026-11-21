import { test as base } from "@playwright/test";
import { Healer } from "../core/healing/heal.ts";
import { LoginPage } from "../pages/LoginPage.ts";
import { PortfolioPage } from "../pages/PortfolioPage.ts";

export interface PageFixtures {
  heal: Healer;
  loginPage: LoginPage;
  portfolioPage: PortfolioPage;
}

/** One fixture per page object. Add new pages here. */
export const test = base.extend<PageFixtures>({
  heal: async ({ page }, use, testInfo) => {
    await use(new Healer(page, testInfo));
  },
  loginPage: async ({ page, heal }, use) => {
    await use(new LoginPage(page, heal));
  },
  portfolioPage: async ({ page, heal }, use) => {
    await use(new PortfolioPage(page, heal));
  },
});
