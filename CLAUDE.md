# Working in qa-tests

Playwright + TypeScript tests for WealthLite (live at https://wealthlite.aswin-qa.workers.dev). Read
`docs/CONVENTIONS.md` before writing code. It is the contract, and CI enforces most of it.

## When you write tests from a Jira story

- Automate only the Test issues listed in `.jira-story.md`. They are the ones with a suite label.
- Put them in one spec per story: `tests/ui/<feature>/kan-<story>-<slug>.spec.ts`, or `tests/api/<feature>/…` for
  API behaviour. If a spec for the story already exists, update it instead of adding a new one.
- Tag the `describe` with the story key and each `test` with its Test issue key and its suite, exactly as in
  `docs/CONVENTIONS.md#tagging`. One `test()` per Test issue. Name it after the behaviour, not the key.
- Turn the Test issue's steps into `test.step(...)` calls, and its expected result into web-first assertions.
- Reuse page objects, components and fixtures. When an element or page is missing, add it to `src/pages` or
  `src/components` and register new pages in `src/fixtures/pages.fixture.ts`. Never put selectors in specs.
- If the app does not have the behaviour yet, the test is expected to fail. Keep it, and don't skip or weaken it.

## Always

- Run `npm run verify` and `npx playwright test --grep @KAN-<story>` before finishing.
- Use synthetic data only. Never add secrets, and never edit `.github/` or `src/core/` unless asked.
- Don't commit, push or open PRs. The workflow does that.
