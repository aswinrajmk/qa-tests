import { test as base, expect } from "@playwright/test";
import { Healer } from "../healing/heal.ts";
import { LoginPage } from "../pages/LoginPage.ts";
import { PortfolioPage } from "../pages/PortfolioPage.ts";

// Synthetic demo account, shown on the WealthLite login page.
export const DEMO_USER = { email: "demo@wealthlite.test", password: "demo-pass-2026", name: "Demo Investor" };

const SCREENSHOT_MAX_BYTES = 200 * 1024;

interface Fixtures {
  heal: Healer;
  loginPage: LoginPage;
  portfolioPage: PortfolioPage;
  /** A page that is already signed in through the API, so portfolio tests do not depend on the login UI. */
  signedIn: PortfolioPage;
  /** Collects browser console output and failed responses, attached to the result as logs. */
  pageLogs: string[];
  /** Takes a compact JPEG screenshot when a test fails. Runs for every test automatically. */
  failureScreenshot: undefined;
}

export const test = base.extend<Fixtures>({
  pageLogs: async ({ page }, use, testInfo) => {
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
    page.on("response", (res) => {
      if (res.status() >= 400)
        logs.push(`[http] ${res.status()} ${res.request().method()} ${new URL(res.url()).pathname}`);
    });
    await use(logs);
    if (logs.length > 0) await testInfo.attach("logs", { body: logs.join("\n"), contentType: "text/plain" });
  },

  failureScreenshot: [
    async ({ page }, use, testInfo) => {
      await use(undefined);
      if (testInfo.status === testInfo.expectedStatus) return;
      for (const quality of [60, 35]) {
        const image = await page.screenshot({ type: "jpeg", quality }).catch(() => null);
        if (image && image.byteLength <= SCREENSHOT_MAX_BYTES) {
          await testInfo.attach("failure-screenshot", { body: image, contentType: "image/jpeg" });
          return;
        }
      }
    },
    { auto: true },
  ],

  heal: async ({ page }, use, testInfo) => {
    await use(new Healer(page, testInfo));
  },

  loginPage: async ({ page, heal, pageLogs }, use) => {
    void pageLogs;
    await use(new LoginPage(page, heal));
  },

  portfolioPage: async ({ page, heal, pageLogs }, use) => {
    void pageLogs;
    await use(new PortfolioPage(page, heal));
  },

  signedIn: async ({ page, portfolioPage }, use) => {
    const response = await page.request.post("/api/login", {
      data: { email: DEMO_USER.email, password: DEMO_USER.password },
    });
    expect(response.ok(), "API sign-in for test setup").toBeTruthy();
    await portfolioPage.goto();
    await expect(portfolioPage.greeting()).toBeVisible();
    await use(portfolioPage);
  },
});

export { expect };
