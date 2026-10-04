import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { fetchBooks } from "@/lib/bookApi";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Book } from "@/types/book";

export default function Likes() {
  const { user } = useAuth();
  const {
    ids,
    loading: loadingFavorites,
    error,
    retry,
    accountSaved,
  } = useFavorites();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookError, setBookError] = useState("");
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBookError("");
    fetchBooks()
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch(() => {
        if (!cancelled) setBookError("도서 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, attempt]);
  const favorites = useMemo(
    () =>
      books.filter(
        (book) =>
          ids.includes(book.id) &&
          (isAdminEmail(user?.email) || !book.isHidden),
      ),
    [books, ids, user?.email],
  );
  const filtered = favorites.filter((book) =>
    `${book.title} ${book.author} ${book.tags.join(" ")}`
      .normalize("NFC")
      .toLowerCase()
      .includes(query.normalize("NFC").toLowerCase().trim()),
  );
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container likes-main">
        <div className="favorites-heading">
          <div>
            <p className="mono-label">SAVED ON MY SHELF</p>
            <h1>다시 펼치고 싶은 책.</h1>
            <p>
              즐겨찾기 <strong>{favorites.length}</strong>권 ·{" "}
              {accountSaved
                ? "계정에 저장됩니다."
                : "이 브라우저에 저장됩니다."}
            </p>
          </div>
          <Star size={38} strokeWidth={1} />
        </div>
        <div className="favorites-toolbar">
          <h2>즐겨찾기 목록</h2>
          <div className="catalog-search">
            <Search size={18} />
            <Input
              aria-label="즐겨찾기 검색"
              placeholder="저장한 책 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {error || bookError ? (
          <div className="favorites-empty" role="alert">
            <p>{error || bookError}</p>
            <Button
              variant="outline"
              onClick={() => {
                retry();
                setAttempt((value) => value + 1);
              }}
            >
              다시 시도
            </Button>
          </div>
        ) : loading || loadingFavorites ? (
          <p className="py-16 text-center text-muted-foreground" role="status">
            즐겨찾기를 불러오는 중...
          </p>
        ) : filtered.length ? (
          <div className="books-grid">
            {filtered.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        ) : (
          <div className="favorites-empty">
            <Star size={32} strokeWidth={1} />
            <h3>
              {favorites.length
                ? "검색 결과가 없습니다."
                : "아직 즐겨찾기한 책이 없습니다."}
            </h3>
            <p>
              {favorites.length
                ? "다른 제목이나 저자로 검색해 보세요."
                : "책 표지의 별 또는 상세보기의 즐겨찾기 버튼을 눌러 모아 보세요."}
            </p>
            {favorites.length ? (
              <Button variant="outline" onClick={() => setQuery("")}>
                검색어 지우기
              </Button>
            ) : (
              <Button asChild>
                <Link to="/">책장 둘러보기 ↗</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
