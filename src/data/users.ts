// Synthetic accounts only. The demo account is printed on the WealthLite login page, so it is not a secret.

export interface User {
  email: string;
  password: string;
  name: string;
}

export const DEMO_USER: Readonly<User> = Object.freeze({
  email: "demo@wealthlite.test",
  password: "demo-pass-2026",
  name: "Demo Investor",
});

export const WRONG_PASSWORD = "not-the-password";
