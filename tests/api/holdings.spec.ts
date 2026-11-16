import { expect, test } from "@playwright/test";
import { DEMO_USER } from "../../src/fixtures/index.ts";

test.describe("Holdings API", () => {
  test("rejects requests without a session", async ({ request }) => {
    const response = await request.get("/api/holdings");
    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ error: "unauthorized" });
  });

  test("returns synthetic holdings whose values add up", async ({ request }) => {
    const login = await request.post("/api/login", { data: { email: DEMO_USER.email, password: DEMO_USER.password } });
    expect(login.status()).toBe(200);

    const response = await request.get("/api/holdings");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      holdings: { units: number; unitPricePence: number; valuePence: number }[];
      totalPence: number;
      currency: string;
    };
    expect(body.currency).toBe("GBP");
    expect(body.holdings).toHaveLength(5);
    for (const h of body.holdings) expect(h.valuePence).toBe(Math.round(h.units * h.unitPricePence));
    expect(body.totalPence).toBe(body.holdings.reduce((sum, h) => sum + h.valuePence, 0));
  });
});
