import { test as base } from "@playwright/test";

const SCREENSHOT_MAX_BYTES = 200 * 1024;

export interface ObservabilityFixtures {
  /** Collects browser console output and failed responses, attached to the result as logs. */
  pageLogs: string[];
  /** Takes a compact JPEG screenshot when a test fails. Runs for every UI test automatically. */
  failureScreenshot: undefined;
}

export const test = base.extend<ObservabilityFixtures>({
  pageLogs: [
    async ({ page }, use, testInfo) => {
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
    { auto: true },
  ],

  failureScreenshot: [
    async ({ page }, use, testInfo) => {
      await use(undefined);
      if (testInfo.status === testInfo.expectedStatus) return;
      // The reporter uploads the screenshot, so keep it small: lower the quality until it fits.
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
});
