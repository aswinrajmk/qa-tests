import type { Locator, Page } from "@playwright/test";
import type { Healer } from "../healing/heal.ts";

export class LoginPage {
  constructor(
    readonly page: Page,
    private readonly heal: Healer,
  ) {}

  readonly email = () => this.page.getByLabel("Email");
  readonly password = () => this.page.getByLabel("Password");
  readonly error = () => this.page.getByRole("alert");

  async goto() {
    await this.page.goto("/login");
  }

  /** The submit button, found through the healer so a label change does not break the flow. */
  submitButton(): Promise<Locator> {
    return this.heal.locate({
      element: "Sign in button",
      primary: {
        description: "getByRole('button', { name: 'Sign in' })",
        locate: (p) => p.getByRole("button", { name: "Sign in", exact: true }),
      },
      fallbacks: [
        { description: "getByTestId('login-submit')", locate: (p) => p.getByTestId("login-submit") },
        { description: "form button[type=submit]", locate: (p) => p.locator("form button[type=submit]") },
      ],
      label: { text: "Sign in", role: "button" },
    });
  }

  async signIn(email: string, password: string) {
    await this.email().fill(email);
    await this.password().fill(password);
    await (await this.submitButton()).click();
  }
}
