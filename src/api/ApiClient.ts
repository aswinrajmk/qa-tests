import { test, type APIRequestContext, type APIResponse } from "@playwright/test";

/**
 * Thin wrapper over Playwright's request context. Each call is a named step, so API traffic reads clearly in
 * reports, and paths are always relative to BASE_URL. Endpoint classes build on this; tests never call it raw.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get(path: string): Promise<APIResponse> {
    return test.step(`GET ${path}`, () => this.request.get(path), { box: true });
  }

  post(path: string, data?: unknown): Promise<APIResponse> {
    return test.step(`POST ${path}`, () => this.request.post(path, { data }), { box: true });
  }
}
