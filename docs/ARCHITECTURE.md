# Architecture

## From a Jira story to a reported result

```
Jira Story (KAN) ──n8n intake──▶ approved Test issues (linked "is tested by")
        │
        └─ you add a suite label (smoke / regression) to some Test issues
                 │
           n8n "Jira Test Automation" ── Telegram approve ──▶ repository_dispatch: jira-tests-labelled {story}
                 │
           automate-from-jira.yml: fetch story + labelled tests ▶ Claude Code (or the local model's draft) ▶ lint, types,
           tag check, run against live app ▶ PR auto/KAN-n ▶ Jira comment + label auto-pr-open
                 │
           merge ▶ jira-sync.yml labels the tests "automated"
                 │
           smoke.yml (every deploy) / regression.yml (nightly) ▶ qa.yml ▶ results reporter ▶ QA dashboard
```

## Inside a test run

```
spec ──uses──▶ fixtures (src/fixtures/index.ts)
                 ├─ pages.fixture        ▶ page objects (src/pages) ▶ components (src/components)
                 ├─ auth.fixture         ▶ signedIn: API sign-in through src/api, then open the page
                 ├─ observability.fixture▶ console + HTTP error logs, failure screenshot (auto)
                 └─ api.fixture          ▶ ApiClient ▶ endpoint classes (src/api/endpoints)
page objects ──▶ Healer (src/core/healing) ▶ "healed" attachment ▶ reporter marks the result Healed
reporter (src/reporters/results-api.ts) ▶ portfolio Results API (live, queued, retried, never fails the run)
```

## Configuration

`config/env.ts` is the only place that reads run settings. `TEST_ENV` (default `prod`) loads
`config/environments/<env>.env`, and real environment variables override the file. Invalid values fail fast with
a clear message, before any browser starts.

## Workflows

| Workflow                 | When                                     | What                                                 |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------- |
| `pr-checks.yml`          | every PR                                 | lint, type-check, unit tests, tag check              |
| `smoke.yml`              | every WealthLite deploy, manual          | `qa.yml` with `@smoke`                               |
| `regression.yml`         | nightly 02:00 UTC, manual                | `qa.yml` with `@smoke\|@regression`                  |
| `qa.yml`                 | called by the two above, Telegram `/run` | the one Playwright run that reports to the dashboard |
| `automate-from-jira.yml` | n8n, after a suite label is approved     | drafts the specs and opens the PR                    |
| `jira-sync.yml`          | an `auto/KAN-*` PR is merged             | marks the Jira tests `automated`                     |
| `claude-change.yml`      | Telegram change request                  | any other change, as a PR                            |

Decisions are recorded in [`adr/`](adr).
