## What and why

<!-- One or two sentences. -->

## Jira

- Story: KAN-
- Test issues: KAN-

## Suites touched

- [ ] @smoke
- [ ] @regression

## Evidence

- [ ] `npm run verify` passes (lint, types, unit tests, tag check)
- [ ] The affected tests pass locally: `npx playwright test --grep @KAN-…`
- [ ] New UI logic lives in a page object or component, not in the spec
