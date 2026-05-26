import { describe, it, expect } from "vitest";
import { normalizeAuthor } from "./frontmatter";

describe("normalizeAuthor", () => {
  it("removes brackets and quotes from string form", () => {
    expect(normalizeAuthor('["크리스타K. 토마슨"]')).toBe("크리스타K. 토마슨");
  });
  it("handles single-item array", () => {
    expect(normalizeAuthor(["크리스타K. 토마슨"])).toBe("크리스타K. 토마슨");
  });
  it("handles multi-author bracketed string", () => {
    expect(normalizeAuthor('["a","b"]')).toBe("a, b");
  });
  it("handles array with comma-joined names", () => {
    expect(normalizeAuthor(["필립 바구스, 안드레아스"])).toBe("필립 바구스, 안드레아스");
  });
  it("strips single quotes", () => {
    expect(normalizeAuthor("'홍길동'")).toBe("홍길동");
  });
  it("returns empty string for null/undefined", () => {
    expect(normalizeAuthor(null)).toBe("");
    expect(normalizeAuthor(undefined)).toBe("");
  });
  it("strips nested brackets", () => {
    expect(normalizeAuthor('[["저자"]]')).toBe("저자");
  });
  it("returns plain author unchanged", () => {
    expect(normalizeAuthor("요한 하리")).toBe("요한 하리");
  });
});