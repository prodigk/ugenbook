import { describe, it, expect } from "vitest";
import { sortBooksForMain } from "./mainSort";
import type { Book, BookStatus, BookCategory } from "@/types/book";

const makeBook = (overrides: Partial<Book> & { id: string }): Book => ({
  id: overrides.id,
  title: overrides.title ?? `Title-${overrides.id}`,
  author: overrides.author ?? `Author-${overrides.id}`,
  bookcover: "",
  tags: [],
  category: (overrides.category ?? "기타") as BookCategory,
  status: (overrides.status ?? "대기") as BookStatus,
  markdown: "",
  fileName: `${overrides.id}.md`,
  createdAt: overrides.createdAt ?? "2024-01-01T00:00:00Z",
  updatedAt: overrides.updatedAt ?? "2024-01-01T00:00:00Z",
  readDate: overrides.readDate,
  isHidden: false,
  ...overrides,
});

describe("sortBooksForMain", () => {
  describe('mode: "read_date"', () => {
    it("정렬: 읽은 날짜 내림차순 (최신이 먼저)", () => {
      const books = [
        makeBook({ id: "a", readDate: "2024-03-01" }),
        makeBook({ id: "b", readDate: "2024-05-10" }),
        makeBook({ id: "c", readDate: "2024-01-15" }),
      ];
      const result = sortBooksForMain(books, "read_date", "newest");
      expect(result.map((b) => b.id)).toEqual(["b", "a", "c"]);
    });

    it("readDate 없는 책은 마지막으로 정렬", () => {
      const books = [
        makeBook({ id: "a", readDate: undefined }),
        makeBook({ id: "b", readDate: "2024-05-10" }),
        makeBook({ id: "c", readDate: "2024-01-15" }),
      ];
      const result = sortBooksForMain(books, "read_date", "newest");
      expect(result.map((b) => b.id)).toEqual(["b", "c", "a"]);
    });

    it("status 우선순위를 무시함", () => {
      const books = [
        makeBook({ id: "old-writing", status: "작성중", readDate: "2024-01-01" }),
        makeBook({ id: "new-waiting", status: "대기", readDate: "2024-12-01" }),
      ];
      const result = sortBooksForMain(books, "read_date", "newest");
      expect(result.map((b) => b.id)).toEqual(["new-waiting", "old-writing"]);
    });
  });

  describe('mode: "updated"', () => {
    it("정렬: updatedAt 내림차순", () => {
      const books = [
        makeBook({ id: "a", updatedAt: "2024-03-01T00:00:00Z" }),
        makeBook({ id: "b", updatedAt: "2024-05-10T00:00:00Z" }),
        makeBook({ id: "c", updatedAt: "2024-01-15T00:00:00Z" }),
      ];
      const result = sortBooksForMain(books, "updated", "newest");
      expect(result.map((b) => b.id)).toEqual(["b", "a", "c"]);
    });

    it("readDate와 무관, updatedAt만 기준", () => {
      const books = [
        makeBook({ id: "a", readDate: "2024-12-31", updatedAt: "2024-01-01T00:00:00Z" }),
        makeBook({ id: "b", readDate: "2020-01-01", updatedAt: "2024-12-01T00:00:00Z" }),
      ];
      const result = sortBooksForMain(books, "updated", "newest");
      expect(result.map((b) => b.id)).toEqual(["b", "a"]);
    });
  });

  describe('mode: "status_read_date"', () => {
    it("상태 우선순위: 작성중 > 완료 > 대기", () => {
      const books = [
        makeBook({ id: "wait", status: "대기", readDate: "2024-12-01" }),
        makeBook({ id: "done", status: "완료", readDate: "2024-12-01" }),
        makeBook({ id: "writing", status: "작성중", readDate: "2024-12-01" }),
      ];
      const result = sortBooksForMain(books, "status_read_date", "newest");
      expect(result.map((b) => b.id)).toEqual(["writing", "done", "wait"]);
    });

    it("같은 상태 안에서는 readDate 내림차순", () => {
      const books = [
        makeBook({ id: "w-old", status: "작성중", readDate: "2024-01-01" }),
        makeBook({ id: "w-new", status: "작성중", readDate: "2024-06-01" }),
        makeBook({ id: "d-new", status: "완료", readDate: "2024-09-01" }),
        makeBook({ id: "d-old", status: "완료", readDate: "2024-02-01" }),
      ];
      const result = sortBooksForMain(books, "status_read_date", "newest");
      expect(result.map((b) => b.id)).toEqual(["w-new", "w-old", "d-new", "d-old"]);
    });
  });

  describe("user sort override (title/author)", () => {
    it("title 정렬은 모드와 상관없이 적용", () => {
      const books = [
        makeBook({ id: "a", title: "다", status: "대기" }),
        makeBook({ id: "b", title: "가", status: "작성중" }),
        makeBook({ id: "c", title: "나", status: "완료" }),
      ];
      const result = sortBooksForMain(books, "status_read_date", "title");
      expect(result.map((b) => b.id)).toEqual(["b", "c", "a"]);
    });

    it("author 정렬도 모드와 상관없이 적용", () => {
      const books = [
        makeBook({ id: "a", author: "박" }),
        makeBook({ id: "b", author: "김" }),
        makeBook({ id: "c", author: "이" }),
      ];
      const result = sortBooksForMain(books, "read_date", "author");
      expect(result.map((b) => b.id)).toEqual(["b", "a", "c"]);
    });
  });

  it("원본 배열을 변경하지 않음", () => {
    const books = [
      makeBook({ id: "a", readDate: "2024-01-01" }),
      makeBook({ id: "b", readDate: "2024-12-01" }),
    ];
    const original = books.map((b) => b.id);
    sortBooksForMain(books, "read_date", "newest");
    expect(books.map((b) => b.id)).toEqual(original);
  });
});