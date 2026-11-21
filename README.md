# qa-tests

Playwright + TypeScript test framework for [WealthLite](https://github.com/aswinrajmk/wealthlite), a demo wealth
app with synthetic data. Every WealthLite deploy runs the smoke suite, and results stream live to the
[QA dashboard](https://portfolio.aswin-qa.workers.dev/dashboard/).

## What it shows

- **Jira traceability from story to result.** Each test is tagged with its Jira story and Test issue
  (`@KAN-…`), and CI rejects a test that isn't. Adding a `smoke` or `regression` label to a Jira Test issue gets
  it automated as a pull request ([how](docs/ARCHITECTURE.md)).
- **Self-healing locators** ([`src/core/healing`](src/core/healing/heal.ts)). When a key element's label
  changes, a fallback finds it and the test is reported as **Healed**, never as a plain pass, along with a
  suggested locator fix.
- **A live custom reporter** ([`src/reporters/results-api.ts`](src/reporters/results-api.ts)). It posts each
  result as it ends, with steps, logs, the error and a compact screenshot. Queued and retried, so a dashboard
  outage never fails the run.
- **Layered design.** Page objects and components, API endpoint clients, and fixtures split by concern.
  A typed, validated env config.
- **Process quality.** Strict TypeScript and ESLint (including Playwright rules), a tag-traceability gate,
  pre-commit hooks, Conventional Commits, a PR template, CODEOWNERS and Dependabot.

## Layout

```
config/             env.ts (typed, validated) + environments/{prod,local}.env
src/
  core/             BasePage, self-healing locators
  pages/            one page object per route
  components/       reusable UI parts (AppHeader, HoldingsTable)
  api/              ApiClient + endpoints/ (AuthApi, HoldingsApi)
  fixtures/         pages · auth · api · observability, merged in index.ts
  data/             synthetic users, response types, parsers
  reporters/        live results reporter for the QA dashboard
tests/
  ui/<feature>/     browser specs
  api/<feature>/    API specs (no browser)
  unit/             node --test for the healing and tag rules
scripts/            check-tags (traceability gate), jira/ helpers for CI
docs/               ARCHITECTURE, CONVENTIONS, adr/
```

## Run

```sh
npm install                       # also installs the git hooks
npx playwright install chromium

npm run test:smoke                # @smoke against live WealthLite
npm run test:regression           # @smoke + @regression
npx playwright test --grep @KAN-6 # one Jira story
npm run test:local                # against a local `npm run dev` of wealthlite (TEST_ENV=local)
npm run verify                    # lint, types, unit tests, tag check: what PR checks run
```

Results go to the dashboard only when `RESULTS_API_TOKEN` is set. Without it, the reporter stays quiet.

## Suites and CI

| Workflow                                                   | When                                        | Runs                       |
| ---------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| [`pr-checks.yml`](.github/workflows/pr-checks.yml)         | every PR                                    | `npm run verify`           |
| [`smoke.yml`](.github/workflows/smoke.yml)                 | every WealthLite deploy                     | `@smoke`                   |
| [`regression.yml`](.github/workflows/regression.yml)       | nightly, manual                             | `@smoke` and `@regression` |
| [`qa.yml`](.github/workflows/qa.yml)                       | called by the above, Telegram `/run @KAN-6` | the reporting run          |
| [`claude-change.yml`](.github/workflows/claude-change.yml) | Telegram change request                     | a PR with the change       |

### Run reports by email

After every smoke and regression run, CI:

- publishes the full interactive Playwright report to **https://aswinrajmk.github.io/qa-tests/reports/**
  (newest 30 runs)
- emails a readable summary to the owner, with the verdict, counts, failed tests with their errors, healed
  locators with suggested fixes, every test grouped by Jira story, and links to the full report, the dashboard
  and the CI log

Partial runs (Telegram `/run @KAN-6`) aren't emailed. Mail goes through Gmail SMTP using the secrets
`MAIL_USERNAME` and `MAIL_APP_PASSWORD` (a Google app password). Without them, CI only warns.

## From a Jira label to an automated test

| Jira label on a Test issue | Set by                          | Meaning                                           |
| -------------------------- | ------------------------------- | ------------------------------------------------- |
| `smoke` / `regression`     | you                             | automate this test in that suite                  |
| `auto-queued`              | n8n, after your YES in Telegram | sent to qa-tests                                  |
| `auto-pr-open`             | `automate-from-jira.yml`        | the PR is open (linked in a comment on the story) |
| `automated`                | `jira-sync.yml` on merge        | the test is in `main`                             |
| `auto-failed`              | `automate-from-jira.yml`        | the run failed. Remove the label to retry         |

Only labelled Test issues are automated. A story's tests go into one spec and one PR.

When you approve in Telegram, you also choose who writes the spec:

- **✅ Claude:** Claude Code works in the repo, reuses the page objects and runs the checks itself.
- **🏠 Local:** the local model on your Mac (Ollama) drafts the spec in one pass, and n8n sends it here. It goes
  through the same checks. If they fail, the PR opens as a draft for you to fix. Use this when no Claude
  subscription is available.

## The self-healing demo

1. In WealthLite, change `SIGN_IN_LABEL` in `src/LoginPage.tsx` from `"Sign in"` to `"Log in"` and push.
2. WealthLite deploys, and the smoke suite runs against the new version:
   - the three sign-in flow tests are **Healed** (found by `data-testid="login-submit"`), with the suggested
     locator `getByRole('button', { name: 'Log in' })`
   - the copy test **fails** (`Expected "Sign in"`, `Received "Log in"`), with a screenshot
3. Change the label back and push to return to green.

## Secrets (GitHub)

| Name                                             | Purpose                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| `RESULTS_API_TOKEN`                              | Bearer token for the portfolio Results API                                 |
| `BOT_GITHUB_TOKEN`                               | Fine-grained PAT used to push bot branches and open PRs (so PR checks run) |
| `BOT_EVENTS_TOKEN`                               | Bearer token for reporting back to the Telegram bot                        |
| `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` | Pays for Claude Code in the change and automation workflows                |

Read [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) before contributing.
