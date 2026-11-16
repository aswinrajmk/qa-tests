import assert from "node:assert/strict";
import { test } from "node:test";
import { areSynonyms, bestMatch, dice, similarity, suggestLocator } from "../../src/healing/similarity.ts";

test("treats sign in / log in as the same action", () => {
  assert.equal(areSynonyms("Sign in", "Log in"), true);
  assert.equal(areSynonyms("Sign in", "LOGIN"), true);
  assert.equal(areSynonyms("Sign in", "Sign out"), false);
  assert.equal(similarity("Sign in", "Log in"), 1);
});

test("dice is 1 for identical text and low for unrelated text", () => {
  assert.equal(dice("Sign in", "sign in"), 1);
  assert.ok(dice("Sign in", "Export CSV") < 0.3);
  assert.ok(dice("Sign in", "Sign in now") > 0.7);
});

test("bestMatch picks the closest label above the threshold", () => {
  assert.deepEqual(bestMatch("Sign in", ["Help", "Log in", "Register"]), { index: 1, score: 1 });
  assert.equal(bestMatch("Sign in", ["Help", "Register"]), null);
});

test("bestMatch refuses to guess between equally good labels", () => {
  assert.equal(bestMatch("Sign in", ["Log in", "Login"]), null);
});

test("suggestLocator writes the locator a person would use", () => {
  assert.equal(suggestLocator("button", "Log in"), "getByRole('button', { name: 'Log in' })");
  assert.equal(suggestLocator(null, "It's here"), "getByText('It\\'s here')");
});
