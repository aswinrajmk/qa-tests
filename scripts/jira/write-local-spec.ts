// Writes the spec drafted by the local model (sent by n8n in the dispatch payload) into the repo.
// Usage: SPEC="<model reply>" FEATURE=auth TESTS=KAN-7,KAN-9 node scripts/jira/write-local-spec.ts KAN-6
// Prints the path to $GITHUB_OUTPUT as `path=…` when it is set.

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { dropUnusedFixtures, extractCode, specPath } from "../lib/local-spec.ts";

const story = process.argv[2] ?? "";
const firstTest = (process.env.TESTS ?? "").split(",")[0] ?? "";
const path = specPath(story, firstTest, process.env.FEATURE ?? "");
const code = dropUnusedFixtures(extractCode(process.env.SPEC ?? ""));

mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, code);
console.log(`Wrote ${path} (${code.length} characters) from the local model's draft`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `path=${path}\n`);
