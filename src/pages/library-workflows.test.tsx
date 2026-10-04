import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Book } from "@/types/book";
import Index from "./Index";
import Admin from "./Admin";

const mocks = vi.hoisted(() => ({
  user: { id: "admin", email: "ugen.kwon@gmail.com" } as {
    id: string;
    email: string;
  } | null,
  deleteBook: vi.fn(),
  updateBook: vi.fn(),
}));
const books: Book[] = [
  {
    id: "one",
    title: "사고외주",
    author: "홍진기",
    bookcover: "",
    tags: ["생각"],
    category: "인문",
    status: "완료",
    markdown: "기록",
    fileName: "one.md",
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
  },
  {
    id: "two",
    title: "슬픔의 발견",
    author: "바버라",
    bookcover: "",
    tags: [],
    category: "과학",
    status: "작성중",
    markdown: "기록",
    fileName: "two.md",
    createdAt: "2026-10-02",
    updatedAt: "2026-10-02",
  },
];
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/components/Header", () => ({ Header: () => null }));
vi.mock("@/components/FeaturedCarousel", () => ({
  FeaturedCarousel: () => null,
}));
vi.mock("@/components/BookCard", () => ({
  BookCard: ({ book }: { book: Book }) => (
    <a href={`/book/${book.id}`}>{book.title}</a>
  ),
}));
vi.mock("@/lib/bookApi", () => ({
  fetchBooks: async () => books,
  deleteBookById: mocks.deleteBook,
  updateBookFields: mocks.updateBook,
  upsertBookFromMd: vi.fn(),
  checkDuplicateFileNames: async () => [],
}));
vi.mock("@/lib/categoryApi", () => ({
  fetchCategories: async () => [
    { id: "a", name: "인문", sort_order: 0 },
    { id: "b", name: "과학", sort_order: 1 },
  ],
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));
vi.mock("@/lib/settingsApi", () => ({
  DEFAULT_MAIN_SORT_MODE: "status_read_date",
  fetchMainSortMode: async () => "status_read_date",
  setMainSortMode: vi.fn(),
}));
vi.mock("@/lib/likesApi", () => ({ fetchUserLikes: async () => [] }));
vi.mock("@/lib/revisionsApi", () => ({
  fetchLatestRevisionMap: async () => ({}),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => ({
          order: () => ({ limit: async () => ({ data: [], error: null }) }),
        }),
      }),
    }),
  },
}));

beforeEach(() => {
  mocks.user = { id: "admin", email: "ugen.kwon@gmail.com" };
  vi.clearAllMocks();
});
afterEach(cleanup);
function showAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<p>로그인 필요</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Library redesign workflows", () => {
  it("clears combined search, category and status filters in one action", async () => {
    render(
      <MemoryRouter initialEntries={["/?q=사고&category=인문&status=완료"]}>
        <Index />
      </MemoryRouter>,
    );
    await screen.findByRole("link", { name: "사고외주" });
    expect(
      screen.queryByRole("link", { name: "슬픔의 발견" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /필터 초기화/ }));
    await screen.findByRole("link", { name: "슬픔의 발견" });
    expect(screen.getByRole("textbox", { name: "도서 검색" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "전체" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^완료/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
  it("navigates between all management sections", async () => {
    showAdmin();
    await screen.findByRole("heading", { name: "등록된 도서 (2권)" });
    const nav = screen.getByRole("navigation", { name: "관리 메뉴" });
    fireEvent.click(within(nav).getByRole("button", { name: /기록 업로드/ }));
    expect(
      screen.getByRole("heading", { name: "마크다운 파일 업로드" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "등록된 도서 (2권)" }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: /카테고리/ }));
    expect(
      screen.getByRole("heading", { name: "카테고리 관리" }),
    ).toBeVisible();
    fireEvent.click(within(nav).getByRole("button", { name: /책장 설정/ }));
    expect(
      screen.getByRole("heading", { name: "메인 정렬 방식" }),
    ).toBeVisible();
  });
  it("requires confirmation before deleting and removes the confirmed book", async () => {
    showAdmin();
    fireEvent.click(
      await screen.findByRole("button", { name: "사고외주 삭제" }),
    );
    expect(mocks.deleteBook).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "취소" }),
    );
    expect(mocks.deleteBook).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "사고외주 삭제" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "삭제" }),
    );
    await waitFor(() => expect(mocks.deleteBook).toHaveBeenCalledWith("one"));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "사고외주 삭제" }),
      ).not.toBeInTheDocument(),
    );
  });
  it("retains admin protection for visitors", async () => {
    mocks.user = null;
    showAdmin();
    expect(await screen.findByText("로그인 필요")).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "관리 메뉴" }),
    ).not.toBeInTheDocument();
  });
  it("retains admin protection for non-admin accounts", async () => {
    mocks.user = { id: "visitor", email: "reader@example.com" };
    showAdmin();
    expect(await screen.findByText("로그인 필요")).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "관리 메뉴" }),
    ).not.toBeInTheDocument();
  });
});
