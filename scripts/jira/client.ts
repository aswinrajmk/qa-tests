import type { adfParagraph } from "./adf.ts";

// Minimal Jira Cloud REST client for CI. Credentials come from the environment and never reach logs.

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: unknown;
    labels: string[];
    issuetype?: { name: string };
    issuelinks?: {
      type: { name: string };
      inwardIssue?: { key: string; fields: { issuetype: { name: string } } };
      outwardIssue?: { key: string; fields: { issuetype: { name: string } } };
    }[];
  };
}

export const STORY_KEY = /^KAN-\d{1,6}$/;
export const SUITE_LABELS = ["smoke", "regression"] as const;

export class Jira {
  private readonly base: string;
  private readonly auth: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const { JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN } = env;
    if (!JIRA_SITE || !JIRA_EMAIL || !JIRA_TOKEN) throw new Error("JIRA_SITE, JIRA_EMAIL and JIRA_TOKEN must be set");
    this.base = (JIRA_SITE.startsWith("http") ? JIRA_SITE : `https://${JIRA_SITE}`).replace(/\/$/, "");
    this.auth = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64")}`;
  }

  browseUrl(key: string): string {
    return `${this.base}/browse/${key}`;
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.base}/rest/api/3${path}`, {
      method,
      headers: { Authorization: this.auth, Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Jira ${method} ${path} responded ${response.status}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  issue(key: string, fields: string[]): Promise<JiraIssue> {
    return this.call("GET", `/issue/${key}?fields=${fields.join(",")}`);
  }

  async search(jql: string, fields: string[]): Promise<JiraIssue[]> {
    const params = new URLSearchParams({ jql, fields: fields.join(","), maxResults: "100" });
    return (await this.call<{ issues: JiraIssue[] }>("GET", `/search/jql?${params}`)).issues;
  }

  /** Keys of the Test issues linked to a story with the "Tests" link (the story "is tested by" them). */
  async linkedTests(story: string): Promise<string[]> {
    const issue = await this.issue(story, ["issuelinks"]);
    return (issue.fields.issuelinks ?? [])
      .filter((l) => l.type.name === "Tests" && l.inwardIssue?.fields.issuetype.name === "Test")
      .map((l) => l.inwardIssue?.key)
      .filter((k): k is string => !!k);
  }

  swapLabel(key: string, remove: string, add: string): Promise<void> {
    return this.call("PUT", `/issue/${key}`, { update: { labels: [{ remove }, { add }] } });
  }

  comment(key: string, body: ReturnType<typeof adfParagraph>): Promise<void> {
    return this.call("POST", `/issue/${key}/comment`, { body });
  }
}
