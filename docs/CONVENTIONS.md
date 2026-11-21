# Conventions

These rules keep the suite readable as it grows. CI checks the ones marked **(enforced)**.

## Layers

| Layer        | Folder                                      | Rule                                                                                                       |
| ------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Specs        | `tests/ui/<feature>`, `tests/api/<feature>` | Describe behaviour. No selectors, URLs or raw HTTP calls.                                                  |
| Fixtures     | `src/fixtures`                              | Setup and teardown. UI specs import `test`, API specs import `apiTest`, both from `src/fixtures/index.ts`. |
| Page objects | `src/pages`                                 | One class per route, extends `BasePage`, declares its `path`.                                              |
| Components   | `src/components`                            | Reusable parts of a page. Take a root locator (or the healer) and work wherever they are placed.           |
| API clients  | `src/api`                                   | `ApiClient` wraps the request context. One endpoint class per resource in `src/api/endpoints`.             |
| Data         | `src/data`                                  | Synthetic data, response types and small parsers. Never real customer data or secrets.                     |
| Framework    | `src/core`, `src/reporters`                 | Self-healing locators and the dashboard reporter. Changes here need a unit test.                           |

## Tagging

Every test traces to Jira **(enforced by `npm run check:tags`)**:

```ts
test.describe("Sign in", { tag: "@KAN-10" }, () => {                        // the Jira Story
  test("signs in with the demo account", { tag: ["@KAN-11", "@smoke"] }, …); // the Jira Test issue + suite
});
```

- The story tag sits on the `describe`. The Test issue tag and exactly one suite tag sit on the `test`.
- Each Jira Test issue is automated by exactly one test.
- `@smoke` is for critical paths that run on every deploy. `@regression` is for everything else, nightly. The regression run includes smoke.
- Keep titles stable. The dashboard keeps history by title, so don't put Jira keys in titles.

Select tests with `--grep`: `@smoke`, `@KAN-10` (a story), `@KAN-11` (one test).

## Locators

- Prefer `getByRole`, `getByLabel` and `getByText`. Use `getByTestId` when there is no accessible name.
- Use the healer (`heal.locate`) for elements whose label is expected to change, with a test id fallback.
- Never use `waitForTimeout`, `page.pause()`, `test.only` or `test.skip` **(enforced by ESLint)**. Rely on web-first assertions (`await expect(locator).toHaveText(…)`).

## Code style

- Formatted by Prettier, linted by ESLint with `typescript-eslint` strict and `eslint-plugin-playwright` **(enforced)**.
- Relative imports with the `.ts` extension. Node runs the unit tests and scripts natively, with no build step.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`test(auth): …`, `fix(core): …`). A local hook checks this.
