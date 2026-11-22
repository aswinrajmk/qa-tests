import assert from "node:assert/strict";
import { test } from "node:test";
import { isStep, jqlFor, labelsToReplace } from "../../scripts/jira/transitions.ts";

test("a merge marks tests automated whether their PR state was recorded or not", () => {
  assert.deepEqual(labelsToReplace("merged", ["regression", "auto-pr-open"]), ["auto-pr-open"]);
  // The PR was merged while a later run for the story still had the tests auto-queued (KAN-26).
  assert.deepEqual(labelsToReplace("merged", ["regression", "auto-queued"]), ["auto-queued"]);
});

test("a merge leaves tests alone that are already automated or were never queued", () => {
  assert.deepEqual(labelsToReplace("merged", ["regression", "automated"]), []);
  assert.deepEqual(labelsToReplace("merged", ["tc-negative"]), []);
});

test("other steps only move queued tests", () => {
  assert.deepEqual(labelsToReplace("pr-open", ["smoke", "auto-queued"]), ["auto-queued"]);
  assert.deepEqual(labelsToReplace("pr-open", ["smoke", "auto-pr-open"]), []);
  assert.deepEqual(labelsToReplace("failed", ["smoke", "auto-pr-open"]), []);
});

test("searches the story's tests in any of the step's starting states", () => {
  assert.equal(
    jqlFor("merged", ["KAN-27", "KAN-29"]),
    'key in (KAN-27,KAN-29) AND labels in ("auto-queued", "auto-pr-open")',
  );
});

test("accepts only known steps", () => {
  assert.equal(isStep("merged"), true);
  assert.equal(isStep("toString"), false);
});
