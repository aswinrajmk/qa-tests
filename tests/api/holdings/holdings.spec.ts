import type { ApiError, HoldingsResponse } from "../../../src/data/types.ts";
import { DEMO_USER } from "../../../src/data/users.ts";
import { apiTest as test, expect } from "../../../src/fixtures/index.ts";

test.describe("Holdings API", { tag: "@KAN-23" }, () => {
  test("rejects requests without a session", { tag: ["@KAN-24", "@regression"] }, async ({ api }) => {
    const response = await api.holdings.list();
    expect(response.status()).toBe(401);
    expect((await response.json()) as ApiError).toMatchObject({ error: "unauthorized" });
  });

  test("returns synthetic holdings whose values add up", { tag: ["@KAN-25", "@smoke"] }, async ({ api }) => {
    const login = await api.auth.login(DEMO_USER);
    expect(login.status()).toBe(200);

    const response = await api.holdings.list();
    expect(response.status()).toBe(200);
    const body = (await response.json()) as HoldingsResponse;
    expect(body.currency).toBe("GBP");
    expect(body.holdings).toHaveLength(5);
    for (const h of body.holdings) expect(h.valuePence).toBe(Math.round(h.units * h.unitPricePence));
    expect(body.totalPence).toBe(body.holdings.reduce((sum, h) => sum + h.valuePence, 0));
  });
});
