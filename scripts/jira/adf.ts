// Atlassian Document Format (Jira rich text) to plain text and back, just enough for stories and test cases.

interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
}

const BLOCKS = new Set(["paragraph", "heading", "listItem", "codeBlock", "blockquote", "tableRow"]);

/** Plain text with one line per block and numbered/bulleted list items, for an AI prompt or a log. */
export function adfToText(node: AdfNode | null | undefined): string {
  if (!node) return "";
  const walk = (n: AdfNode, prefix = ""): string => {
    if (n.type === "text") return n.text ?? "";
    if (n.type === "hardBreak") return "\n";
    if (n.type === "orderedList" || n.type === "bulletList") {
      return (n.content ?? []).map((item, i) => walk(item, n.type === "orderedList" ? `${i + 1}. ` : "- ")).join("");
    }
    const inner = (n.content ?? []).map((c) => walk(c)).join("");
    return BLOCKS.has(n.type) ? `${prefix}${inner.trim()}\n` : inner;
  };
  return walk(node)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** A one-paragraph ADF document with an optional link, for Jira comments. */
export function adfParagraph(text: string, link?: { text: string; href: string }) {
  const content: object[] = [{ type: "text", text }];
  if (link) content.push({ type: "text", text: link.text, marks: [{ type: "link", attrs: { href: link.href } }] });
  return { type: "doc", version: 1, content: [{ type: "paragraph", content }] };
}
