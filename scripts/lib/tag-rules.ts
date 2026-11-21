// Pure tagging rules, kept apart from the CLI so they are unit tested (tests/unit/tag-rules.test.ts).
// Playwright reports tags without "@", inherited ones first: [describe tags..., test tags...].

export interface ListedTest {
  title: string;
  location: string;
  tags: string[];
}

const SUITE_TAGS = new Set(["smoke", "regression"]);
const JIRA_KEY = /^KAN-\d+$/;

export interface Traced {
  story: string;
  testKey: string;
  suite: string;
}

/** Returns the problems with one test's tags, or the story / test key / suite when it is valid. */
export function checkTest(test: ListedTest): { problems: string[]; traced?: Traced } {
  const problems: string[] = [];
  const unknown = test.tags.filter((t) => !SUITE_TAGS.has(t) && !JIRA_KEY.test(t));
  const suites = test.tags.filter((t) => SUITE_TAGS.has(t));
  const keys = test.tags.filter((t) => JIRA_KEY.test(t));

  if (unknown.length) problems.push(`unknown tag(s) ${unknown.map((t) => "@" + t).join(", ")}`);
  if (suites.length !== 1) problems.push(`needs exactly one suite tag (@smoke or @regression), has ${suites.length}`);
  if (keys.length !== 2) {
    problems.push(
      `needs a story tag on its describe and a Test issue tag on the test (2 Jira keys), has ${keys.length}`,
    );
  } else if (keys[0] === keys[1]) {
    problems.push(`story and Test issue tags are both @${keys[0]}`);
  }
  if (problems.length) return { problems };
  const [story, testKey] = keys as [string, string];
  return { problems, traced: { story, testKey, suite: suites[0] as string } };
}

/** Checks every test and that no Jira Test issue is automated twice. Returns readable error lines. */
export function checkAll(tests: ListedTest[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  for (const test of tests) {
    const { problems, traced } = checkTest(test);
    for (const p of problems) errors.push(`${test.location} "${test.title}": ${p}`);
    if (!traced) continue;
    const other = seen.get(traced.testKey);
    if (other) errors.push(`${test.location} "${test.title}": @${traced.testKey} is already used at ${other}`);
    else seen.set(traced.testKey, test.location);
  }
  return errors;
}
