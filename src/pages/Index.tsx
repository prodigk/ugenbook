import { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { SearchFilter } from "@/components/SearchFilter";
import { fetchBooks } from "@/lib/bookApi";
import { fetchUserLikes } from "@/lib/likesApi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import type { Book, BookCategory, BookStatus, SortOption } from "@/types/book";

const Index = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  useEffect(() => {
    const load = async () => {
      try {
        const allBooks = await fetchBooks();
        setBooks(allBooks);
        if (user && isAdminEmail(user.email)) {
          const ids = await fetchUserLikes(user.id);
          setLikedIds(new Set(ids));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleToggleLike = useCallback((bookId: string, newLiked: boolean) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (newLiked) next.add(bookId);
      else next.delete(bookId);
      return next;
    });
  }, []);

  const filteredBooks = useMemo(() => {
    const isAdmin = user && isAdminEmail(user.email);
    let result = isAdmin ? books : books.filter((b) => !b.isHidden);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (selectedStatus) {
      result = result.filter((b) => b.status === selectedStatus);
    }

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "title":
          return a.title.localeCompare(b.title, "ko");
        case "author":
          return a.author.localeCompare(b.author, "ko");
        default:
          return 0;
      }
    });

    return result;
  }, [books, query, selectedCategory, selectedStatus, sortOption]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            UGEN 책장
          </h1>
          <p className="mt-2 text-muted-foreground">
            읽고, 기록하고, 나누는 독서의 여정
          </p>
        </div>

        <SearchFilter
          query={query}
          onQueryChange={setQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortOption={sortOption}
          onSortChange={setSortOption}
          totalCount={filteredBooks.length}
        />

        {loading ? (
          <div className="mt-16 text-center text-muted-foreground">불러오는 중...</div>
        ) : filteredBooks.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredBooks.map((book, idx) => (
              <BookCard
                key={book.id}
                book={book}
                index={idx}
                liked={likedIds.has(book.id)}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <p className="font-serif text-xl text-muted-foreground">
              {books.length === 0
                ? "아직 등록된 도서가 없습니다"
                : "검색 결과가 없습니다"}
            </p>
            {books.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                관리 페이지에서 마크다운 파일을 업로드하여 시작하세요
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
