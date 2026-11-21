import assert from "node:assert/strict";
import { test } from "node:test";
import { adfParagraph, adfToText } from "../../scripts/jira/adf.ts";

const t = (text: string) => ({ type: "text", text });
const p = (text: string) => ({ type: "paragraph", content: [t(text)] });

test("turns headings, paragraphs and lists into readable lines", () => {
  const doc = {
    type: "doc",
    content: [
      { type: "heading", content: [t("Steps")] },
      {
        type: "orderedList",
        content: [
          { type: "listItem", content: [p("Open login")] },
          { type: "listItem", content: [p("Submit")] },
        ],
      },
      { type: "heading", content: [t("Expected result")] },
      p("An error shows"),
    ],
  };
  assert.equal(adfToText(doc), "Steps\n1. Open login\n2. Submit\nExpected result\nAn error shows");
});

test("handles a missing description", () => {
  assert.equal(adfToText(undefined), "");
});

test("builds a comment paragraph with a link", () => {
  const doc = adfParagraph("PR: ", { text: "#5", href: "https://github.com/o/r/pull/5" });
  assert.deepEqual(doc.content[0]?.content[1], {
    type: "text",
    text: "#5",
    marks: [{ type: "link", attrs: { href: "https://github.com/o/r/pull/5" } }],
  });
});
