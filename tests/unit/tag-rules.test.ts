import assert from "node:assert/strict";
import { test } from "node:test";
import { checkAll, checkTest } from "../../scripts/lib/tag-rules.ts";

const at = (tags: string[]) => ({ title: "t", location: "tests/x.spec.ts:1", tags });

test("accepts a story tag, a Test issue tag and one suite", () => {
  assert.deepEqual(checkTest(at(["KAN-6", "KAN-7", "smoke"])).traced, {
    story: "KAN-6",
    testKey: "KAN-7",
    suite: "smoke",
  });
});

test("rejects a test with no suite or two suites", () => {
  assert.equal(checkTest(at(["KAN-6", "KAN-7"])).problems.length, 1);
  assert.equal(checkTest(at(["KAN-6", "KAN-7", "smoke", "regression"])).problems.length, 1);
});

test("rejects missing or repeated Jira keys and unknown tags", () => {
  assert.match(checkTest(at(["KAN-6", "smoke"])).problems.join(), /2 Jira keys/);
  assert.match(checkTest(at(["KAN-6", "KAN-6", "smoke"])).problems.join(), /both @KAN-6/);
  assert.match(checkTest(at(["REQ-1", "KAN-6", "KAN-7", "smoke"])).problems.join(), /unknown tag/);
});

test("flags a Jira Test issue automated by two tests", () => {
  const errors = checkAll([at(["KAN-6", "KAN-7", "smoke"]), at(["KAN-6", "KAN-7", "regression"])]);
  assert.equal(errors.length, 1);
  assert.match(errors.join(), /already used/);
});
