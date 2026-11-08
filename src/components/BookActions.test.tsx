import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BookActions } from "./BookActions";
import type { Book } from "@/types/book";

const book: Book = {
  id: "45b563f0-40b4-4b40-98a1-3d2a4c16f0a3",
  title: "테스트 도서",
  author: "홍길동",
  bookcover: "",
  tags: [],
  category: "문학",
  status: "완료",
  markdown: "",
  fileName: "test.md",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});
afterEach(cleanup);

function renderMenu(canManage: boolean) {
  render(
    <MemoryRouter>
      <BookActions book={book} onBookChange={vi.fn()} canManage={canManage} />
    </MemoryRouter>,
  );
  fireEvent.keyDown(screen.getByRole("button", { name: "도서 메뉴" }), { key: "Enter" });
}

it("offers a short share link in the ellipsis menu to visitors", async () => {
  renderMenu(false);
  const copy = await screen.findByRole("menuitem", { name: "공유 링크 복사" });
  expect(screen.queryByRole("menuitem", { name: "도서 삭제" })).not.toBeInTheDocument();
  fireEvent.click(copy);
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/s/RbVj8EC0S0CYoT0qTBbwow`,
    ),
  );
});

it("keeps management actions in the ellipsis menu for admins", async () => {
  renderMenu(true);
  expect(await screen.findByRole("menuitem", { name: "공유 링크 복사" })).toBeVisible();
  expect(screen.getByRole("menuitem", { name: "도서 감추기" })).toBeVisible();
  expect(screen.getByRole("menuitem", { name: "도서 삭제" })).toBeVisible();
});
