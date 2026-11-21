# 1. Jira is the single source of truth for requirements and test cases

Date: 2026-11-21 · Status: accepted

## Context

Requirements used to be GitHub issues in wealthlite, with `@REQ-n` tags. The Jira intake flow now creates
approved Test issues from stories, so there were two sources for the same thing.

## Decision

- Jira project KAN holds the stories and Test issues. GitHub requirement issues and `requirement.yml` are retired.
- Specs tag the story on the `describe` and the Test issue on the `test`. `check-tags` enforces this.
- A Test issue is automated only after someone adds a suite label (`smoke` or `regression`). Not every manual
  test case is worth automating, and choosing them is a QA decision.
- Suite membership lives in the spec's tag, not in a list in config, so it cannot drift from the tests.

## Consequences

- Traceability goes both ways: from a Jira test to its spec (`--grep @KAN-n`), and from a result to its story
  on the dashboard.
- The dashboard reads stories from Jira instead of GitHub.
- Changing a suite label on an already automated test needs a retag. That is a follow-up.
