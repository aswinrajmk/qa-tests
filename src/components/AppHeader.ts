import type { Healer } from "../core/healing/heal.ts";

/** Header shown on signed-in pages. */
export class AppHeader {
  constructor(private readonly heal: Healer) {}

  async signOut(): Promise<void> {
    const button = await this.heal.locate({
      element: "Sign out button",
      primary: {
        description: "getByRole('button', { name: 'Sign out' })",
        locate: (p) => p.getByRole("button", { name: "Sign out", exact: true }),
      },
      fallbacks: [{ description: "getByTestId('sign-out')", locate: (p) => p.getByTestId("sign-out") }],
      label: { text: "Sign out", role: "button" },
    });
    await button.click();
  }
}
