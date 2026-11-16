# qa-tests

Playwright + TypeScript test framework for [WealthLite](https://github.com/aswinrajmk/wealthlite), a demo
wealth app with synthetic data. Every WealthLite deploy triggers this suite, and results stream live to the
[QA dashboard](https://portfolio.aswin-qa.workers.dev/dashboard/).

## What it shows

- **Self-healing locators** ([`src/healing/heal.ts`](src/healing/heal.ts)). Key elements have a primary
  locator and ordered fallbacks: test id, form structure, then text similarity with synonyms (for example,
  "Sign in" and "Log in"). When a fallback finds exactly one element, the test carries on and is reported
  as **Healed**, never as a plain pass. The report names the broken locator, the one used, and a suggested
  fix.
- **A live custom reporter** ([`reporters/results-api.ts`](reporters/results-api.ts)). It posts each result
  as soon as the test ends: status, steps, logs, the error, and a compact JPEG screenshot on failure. A
  queue with retries means a dashboard outage never fails or slows the run.
- **Typed fixtures** ([`src/fixtures`](src/fixtures/index.ts)) and thin page objects: a signed-in state
  through the API, page log capture, and automatic failure screenshots.
- **Layers:** API tests (`tests/api`), UI flows (`tests/e2e`), content and accessibility checks, and unit
  tests for the healing logic (`tests/unit`, run with `node --test`).

## How the demo works

1. In WealthLite, change `SIGN_IN_LABEL` in `src/LoginPage.tsx` from `"Sign in"` to `"Log in"` and push.
2. WealthLite deploys, then sends a `wealthlite-deployed` event to this repo.
3. This suite runs against the new version, and the dashboard shows it live:
   - the three sign-in flow tests are **Healed** (found by `data-testid="login-submit"`), with the
     suggested locator `getByRole('button', { name: 'Log in' })`
   - the copy test **fails** (`Expected "Sign in"`, `Received "Log in"`), with a screenshot
   - everything else passes
4. Change the label back and push to return to green.

## Requirements drive the tests

Each WealthLite requirement is a GitHub issue with the `requirement` label and Given/When/Then acceptance
criteria. Tests carry the issue number as a tag, for example `@REQ-3`, and the dashboard's
[requirements coverage](https://portfolio.aswin-qa.workers.dev/dashboard/#requirements) matrix shows each
requirement with its linked tests and their latest result.

When the owner opens or edits a requirement issue, WealthLite sends a `requirement-changed` event here and
[`requirement.yml`](.github/workflows/requirement.yml) runs:

1. Claude Code reads the requirement and drafts (or updates) tests tagged `@REQ-<issue>`, following the
   existing page objects and fixtures.
2. The workflow runs lint, type-check and those tests against live WealthLite. Drafts never report to the
   public dashboard.
3. It opens a pull request (or updates the open one) and messages the owner on Telegram with the
   pass/fail counts. Failing tests are expected when the app does not have the behaviour yet.
4. After merge, every QA run reports the new tests, so the matrix moves from failing to passing once
   WealthLite implements the requirement.

Only open issues written and labelled by the owner are used, because their text goes to an AI agent.

## Run part of the suite

```sh
npx playwright test --grep @REQ-1       # one requirement
npx playwright test --grep login        # by title
```

In CI, the QA suite workflow takes the same pattern as its `grep` input. From Telegram, `/run @REQ-1`
(or "run the tests for requirement 1") starts it after a YES.

## Run locally

```sh
npm install
npx playwright install chromium
npm run test:unit
npx playwright test                                  # against the live WealthLite
BASE_URL=http://localhost:5173 npx playwright test   # against a local `npm run dev` of WealthLite
```

Results go to the dashboard only when `RESULTS_API_TOKEN` is set. Without it, the reporter stays quiet.

## Secrets (GitHub)

| Name                                             | Purpose                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `RESULTS_API_TOKEN`                              | Bearer token for the portfolio Results API (same value as the portfolio repo secret) |
| `BOT_GITHUB_TOKEN`                               | Fine-grained PAT used to push bot branches and open PRs (so PR checks run)           |
| `BOT_EVENTS_TOKEN`                               | Bearer token for reporting back to the Telegram bot                                  |
| `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` | Pays for Claude Code in the change and requirement workflows                         |
