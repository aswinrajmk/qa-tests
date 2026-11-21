import assert from "node:assert/strict";
import { test } from "node:test";
import { extractCode, specPath } from "../../scripts/lib/local-spec.ts";

test("builds a new spec path per story and first test, inside a safe folder", () => {
  assert.equal(specPath("KAN-6", "KAN-7", "auth"), "tests/ui/auth/kan-6-kan-7.spec.ts");
  assert.equal(specPath("KAN-6", "KAN-7", "../../.github"), "tests/ui/stories/kan-6-kan-7.spec.ts");
  assert.throws(() => specPath("KAN-6", "rm -rf", "auth"));
});

test("takes the code from a fenced block and ignores the chatter around it", () => {
  const reply = 'Here is the spec:\n```ts\ntest.describe("x", () => {});\n```\nHope it helps.';
  assert.equal(extractCode(reply), 'test.describe("x", () => {});\n');
});

test("accepts a bare reply and rejects one with no test", () => {
  assert.equal(extractCode('test("a", async () => {});'), 'test("a", async () => {});\n');
  assert.throws(() => extractCode("Sorry, I cannot help with that."));
});
