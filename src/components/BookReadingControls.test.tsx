import { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { BookReadingControls } from "./BookReadingControls";
import { updateBookFields } from "@/lib/bookApi";
import type { Book } from "@/types/book";
vi.mock("@/lib/bookApi", () => ({ updateBookFields: vi.fn() }));
const initial: Book = {
  id: "old-book",
  title: "오래된 독서 기록",
  author: "작가",
  bookcover: "",
  tags: [],
  category: "인문",
  status: "작성중",
  readDate: "2026-01-31",
  markdown: "",
  fileName: "old.md",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};
function Example({ canEdit = true }: { canEdit?: boolean }) {
  const [book, setBook] = useState(initial);
  return (
    <MemoryRouter>
      <BookReadingControls
        book={book}
        canEdit={canEdit}
        onChange={(fields) => setBook((prev) => ({ ...prev, ...fields }))}
      />
    </MemoryRouter>
  );
}
beforeEach(() => vi.mocked(updateBookFields).mockReset());
afterEach(cleanup);
it("jumps directly to a past year and month without rolling January 31 into March, then persists the chosen day", async () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "읽은 날짜 변경" }));
  fireEvent.change(screen.getByRole("combobox", { name: "읽은 연도" }), {
    target: { value: "2018" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "읽은 월" }), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("gridcell", { name: "2018년 2월 15일" }));
  expect(updateBookFields).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "날짜 저장" }));
  await waitFor(() =>
    expect(updateBookFields).toHaveBeenCalledWith("old-book", {
      read_date: "2018-02-15",
    }),
  );
  expect(
    screen.getByRole("button", { name: "읽은 날짜 변경" }),
  ).toHaveTextContent("2018. 2. 15.");
});
it("updates status and keeps only the saved status selected", async () => {
  render(<Example />);
  fireEvent.change(screen.getByRole("combobox", { name: "기록 상태" }), {
    target: { value: "대기" },
  });
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "기록 상태" })).toHaveValue(
      "대기",
    ),
  );
  expect(updateBookFields).toHaveBeenCalledWith("old-book", { status: "대기" });
});
it("does not display an unsuccessful write as saved", async () => {
  vi.mocked(updateBookFields).mockRejectedValueOnce(new Error("Denied"));
  render(<Example />);
  fireEvent.change(screen.getByRole("combobox", { name: "기록 상태" }), {
    target: { value: "완료" },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "저장하지 못했습니다",
  );
  expect(screen.getByRole("combobox", { name: "기록 상태" })).toHaveValue(
    "작성중",
  );
});
it("clears a date only when the user saves", async () => {
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "읽은 날짜 변경" }));
  fireEvent.click(screen.getByRole("button", { name: "날짜 지우기" }));
  expect(updateBookFields).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "날짜 저장" }));
  await waitFor(() =>
    expect(updateBookFields).toHaveBeenCalledWith("old-book", {
      read_date: null,
    }),
  );
  expect(
    screen.getByRole("button", { name: "읽은 날짜 변경" }),
  ).toHaveTextContent("날짜 지정");
});
it("shows visitors plain metadata without edit controls", () => {
  render(<Example canEdit={false} />);
  expect(screen.getByText("작성중")).toBeVisible();
  expect(
    screen.queryByRole("combobox", { name: "기록 상태" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "읽은 날짜 변경" }),
  ).not.toBeInTheDocument();
  expect(updateBookFields).not.toHaveBeenCalled();
});
