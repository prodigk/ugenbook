import { describe, expect, it } from "vitest";
import { bookIdToShortCode, shortCodeToBookId } from "./shareLink";
import { renderBookMetaHtml } from "../../api/book-meta";

describe("book share links", () => {
  const id = "45b563f0-40b4-4b40-98a1-3d2a4c16f0a3";

  it("encodes a UUID into a short, reversible URL segment", () => {
    const code = bookIdToShortCode(id);
    expect(code).toHaveLength(22);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(shortCodeToBookId(code)).toBe(id);
    expect(shortCodeToBookId("invalid")).toBeNull();
  });

  it("renders the selected book's title, author, category, and cover safely", () => {
    const template = `<title>UGENs 책장</title><meta name="description" content="책장" /><!-- BOOK_META -->`;
    const html = renderBookMetaHtml(template, {
      title: `A "book" & <more>`,
      author: "홍길동",
      category: "문학",
      bookcover: "https://example.com/cover.jpg",
    }, `https://ugenbook.vercel.app/s/${bookIdToShortCode(id)}`, `https://ugenbook.vercel.app/api/book-image?id=${id}`);

    expect(html).toContain('property="og:title" content="A &quot;book&quot; &amp; &lt;more&gt;"');
    expect(html).toContain('property="og:description" content="작가 홍길동 · 분야 문학"');
    expect(html).toContain(`property="og:image" content="https://ugenbook.vercel.app/api/book-image?id=${id}"`);
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).not.toContain("<!-- BOOK_META -->");
  });
});
