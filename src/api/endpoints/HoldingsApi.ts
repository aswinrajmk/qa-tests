import type { APIResponse } from "@playwright/test";
import type { ApiClient } from "../ApiClient.ts";

export class HoldingsApi {
  constructor(private readonly client: ApiClient) {}

  list(): Promise<APIResponse> {
    return this.client.get("/api/holdings");
  }
}
