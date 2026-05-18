import type { Book, SortOption } from "@/types/book";
import type { MainSortMode } from "@/lib/settingsApi";

const statusPriority = (s: string) => (s === "작성중" ? 0 : s === "완료" ? 1 : 2);
const readTime = (b: Book) => (b.readDate ? new Date(b.readDate + "T00:00:00").getTime() : 0);
const updatedTime = (b: Book) => new Date(b.updatedAt).getTime();

/**
 * Sort books for the main page according to the admin-selected main sort mode
 * and the user-selected sort option. Returns a new array (does not mutate).
 */
export function sortBooksForMain(
  books: Book[],
  mainSortMode: MainSortMode,
  sortOption: SortOption
): Book[] {
  const userSort = (a: Book, b: Book) => {
    switch (sortOption) {
      case "title":
        return a.title.localeCompare(b.title, "ko");
      case "author":
        return a.author.localeCompare(b.author, "ko");
      case "newest":
      default:
        if (mainSortMode === "read_date") return readTime(b) - readTime(a);
        if (mainSortMode === "updated") return updatedTime(b) - updatedTime(a);
        return readTime(b) - readTime(a);
    }
  };

  return [...books].sort((a, b) => {
    if (mainSortMode === "status_read_date" && sortOption === "newest") {
      const sp = statusPriority(a.status) - statusPriority(b.status);
      if (sp !== 0) return sp;
    }
    return userSort(a, b);
  });
}