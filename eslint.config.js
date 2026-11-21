import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["playwright-report", "test-results"] },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Playwright best practice for specs: no sleeps, no focused/skipped tests, no forgotten awaits.
    files: ["tests/ui/**/*.ts", "tests/api/**/*.ts"],
    ...playwright.configs["flat/recommended"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": "error",
      "playwright/no-page-pause": "error",
      "playwright/missing-playwright-await": "error",
      "playwright/no-raw-locators": "warn",
      "playwright/prefer-web-first-assertions": "error",
    },
  },
  {
    // Page objects and components wrap locators, so raw locators are allowed there but sleeps are not.
    files: ["src/**/*.ts"],
    plugins: { playwright },
    rules: { "playwright/no-wait-for-timeout": "error", "playwright/no-page-pause": "error" },
  },
);
