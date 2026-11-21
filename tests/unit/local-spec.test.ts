import assert from "node:assert/strict";
import { test } from "node:test";
import { dropUnusedFixtures, extractCode, specPath } from "../../scripts/lib/local-spec.ts";

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

test("drops fixtures each test does not use, test by test", () => {
  const code = [
    'test("a", async ({ signedIn, loginPage, portfolioPage }) => {',
    "  await signedIn.header.signOut();",
    "  await expect(loginPage.heading()).toBeVisible();",
    "});",
    'test("b", async ({ signedIn, portfolioPage }) => {',
    "  await portfolioPage.goto();",
    "});",
  ].join("\n");
  const out = dropUnusedFixtures(code);
  assert.match(out, /async \(\{ signedIn, loginPage \}\) =>/);
  assert.match(out, /async \(\{ portfolioPage \}\) =>/);
});
