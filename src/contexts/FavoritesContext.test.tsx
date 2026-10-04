import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { FavoritesProvider } from "./FavoritesContext";
import { FavoriteButton } from "@/components/FavoriteButton";
import Likes from "@/pages/Likes";
import { fetchUserLikes, toggleLike } from "@/lib/likesApi";
const auth = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, loading: false }),
}));
vi.mock("@/components/Header", () => ({ Header: () => null }));
vi.mock("@/lib/likesApi", () => ({
  fetchUserLikes: vi.fn(),
  toggleLike: vi.fn(),
}));
vi.mock("@/lib/bookApi", () => ({
  fetchBooks: async () => [
    {
      id: "book-a",
      title: "사고외주",
      author: "홍진기",
      bookcover: "",
      tags: [],
      category: "인문",
      status: "완료",
    },
  ],
}));
function Example() {
  return (
    <MemoryRouter>
      <FavoritesProvider>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <FavoriteButton bookId="book-a" title="사고외주" />
                <Link to="/favorites">모아 보기</Link>
              </>
            }
          />
          <Route path="/favorites" element={<Likes />} />
        </Routes>
      </FavoritesProvider>
    </MemoryRouter>
  );
}
beforeEach(() => {
  auth.user = null;
  localStorage.clear();
  vi.mocked(fetchUserLikes).mockReset().mockResolvedValue([]);
  vi.mocked(toggleLike).mockReset().mockResolvedValue();
});
afterEach(cleanup);
it("saves guest favorites across reloads and removes them from the separate list", async () => {
  const first = render(<Example />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "사고외주 즐겨찾기 추가" }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "사고외주 즐겨찾기 추가" }),
  );
  await screen.findByRole("button", { name: "사고외주 즐겨찾기 해제" });
  first.unmount();
  render(<Example />);
  await screen.findByRole("button", { name: "사고외주 즐겨찾기 해제" });
  fireEvent.click(screen.getByRole("link", { name: "모아 보기" }));
  await screen.findByRole("heading", { name: "사고외주" });
  fireEvent.click(
    screen.getByRole("button", { name: "사고외주 즐겨찾기 해제" }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "아직 즐겨찾기한 책이 없습니다.",
    }),
  ).toBeVisible();
  expect(toggleLike).not.toHaveBeenCalled();
});
it("retains existing account likes as favorites and persists changes to the account", async () => {
  auth.user = { id: "admin", email: "ugen.kwon@gmail.com" };
  vi.mocked(fetchUserLikes).mockResolvedValue(["book-a"]);
  render(<Example />);
  fireEvent.click(
    await screen.findByRole("button", { name: "사고외주 즐겨찾기 해제" }),
  );
  await waitFor(() =>
    expect(toggleLike).toHaveBeenCalledWith("admin", "book-a", true),
  );
  await screen.findByRole("button", { name: "사고외주 즐겨찾기 추가" });
  expect(localStorage.getItem("ugenbook:favorites:v1")).toBeNull();
});
it("keeps a favorite selected if saving its removal fails", async () => {
  auth.user = { id: "admin", email: "ugen.kwon@gmail.com" };
  vi.mocked(fetchUserLikes).mockResolvedValue(["book-a"]);
  vi.mocked(toggleLike).mockRejectedValue(new Error("Denied"));
  render(<Example />);
  fireEvent.click(
    await screen.findByRole("button", { name: "사고외주 즐겨찾기 해제" }),
  );
  await waitFor(() => expect(toggleLike).toHaveBeenCalled());
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "사고외주 즐겨찾기 해제" }),
    ).toBeEnabled(),
  );
  expect(
    screen.getByRole("button", { name: "사고외주 즐겨찾기 해제" }),
  ).toHaveAttribute("aria-pressed", "true");
});
