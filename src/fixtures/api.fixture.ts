import { test as base } from "@playwright/test";
import { ApiClient } from "../api/ApiClient.ts";
import { AuthApi } from "../api/endpoints/AuthApi.ts";
import { HoldingsApi } from "../api/endpoints/HoldingsApi.ts";

export interface Api {
  auth: AuthApi;
  holdings: HoldingsApi;
}

export interface ApiFixtures {
  /** Endpoint clients over the test's own request context (no browser is started). */
  api: Api;
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    const client = new ApiClient(request);
    await use({ auth: new AuthApi(client), holdings: new HoldingsApi(client) });
  },
});
