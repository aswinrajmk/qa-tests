import type { APIResponse } from "@playwright/test";
import type { User } from "../../data/users.ts";
import type { ApiClient } from "../ApiClient.ts";

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  /** Signs in. The session cookie lands in the request context the client was built from. */
  login(user: Pick<User, "email" | "password">): Promise<APIResponse> {
    return this.client.post("/api/login", { email: user.email, password: user.password });
  }
}
