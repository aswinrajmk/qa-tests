# 2. Self-healing locators that never hide a change

Date: 2026-11-21 · Status: accepted

## Context

Label changes in the UI break flow tests that are not about the label, which creates noise.

## Decision

Key elements resolve through `Healer.locate`: primary locator, then ordered fallbacks, then text similarity. A
healed lookup lets the flow continue, but the result is reported as **Healed** with the broken locator and a
suggested fix. Copy tests still assert exact text, so the change itself is always reported as a failure.

## Consequences

Flows stay green through cosmetic changes, while the report still shows each locator to fix. Healing logic is
unit tested (`tests/unit/similarity.test.ts`).
