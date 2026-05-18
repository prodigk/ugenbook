import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BookCard } from "@/components/BookCard";
import { SearchFilter } from "@/components/SearchFilter";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import {
  FeaturedCarouselSkeleton,
  SearchFilterSkeleton,
  BookGridSkeleton,
} from "@/components/skeletons/MainPageSkeleton";
import { fetchBooks } from "@/lib/bookApi";
import { fetchUserLikes } from "@/lib/likesApi";
import { fetchLatestRevisionMap } from "@/lib/revisionsApi";
import { fetchMainSortMode, DEFAULT_MAIN_SORT_MODE, type MainSortMode } from "@/lib/settingsApi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import type { Book, BookCategory, BookStatus, SortOption } from "@/types/book";
import ugenSymbol from "@/assets/ugen-symbol.png";

const Index = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [revisionMap, setRevisionMap] = useState<Record<string, string>>({});
  const [mainSortMode, setMainSortMode] = useState<MainSortMode>(DEFAULT_MAIN_SORT_MODE);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const selectedCategory = (searchParams.get("category") as BookCategory | null) || null;
  const selectedStatus = (searchParams.get("status") as BookStatus | null) || null;
  const sortOption = ((searchParams.get("sort") as SortOption) || "newest") as SortOption;

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setQuery = useCallback((v: string) => updateParam("q", v), [updateParam]);
  const setSelectedCategory = useCallback(
    (v: BookCategory | null) => updateParam("category", v),
    [updateParam]
  );
  const setSelectedStatus = useCallback(
    (v: BookStatus | null) => updateParam("status", v),
    [updateParam]
  );
  const setSortOption = useCallback(
    (v: SortOption) => updateParam("sort", v === "newest" ? null : v),
    [updateParam]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const allBooks = await fetchBooks();
        setBooks(allBooks);
        fetchMainSortMode().then(setMainSortMode).catch(console.error);
        if (user && isAdminEmail(user.email)) {
          const ids = await fetchUserLikes(user.id);
          setLikedIds(new Set(ids));
        }
        try {
          const map = await fetchLatestRevisionMap(allBooks.map((b) => b.id));
          setRevisionMap(map);
        } catch (e) {
          console.error(e);
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
      if (newLiked) next.add(bookId);else
      next.delete(bookId);
      return next;
    });
  }, []);

  const visibleBooks = useMemo(() => {
    const isAdmin = user && isAdminEmail(user.email);
    return isAdmin ? books : books.filter((b) => !b.isHidden);
  }, [books, user]);

  const featuredBooks = useMemo(() => {
    const byReadDateDesc = (a: Book, b: Book) => {
      const aTime = a.readDate ? new Date(a.readDate + "T00:00:00").getTime() : 0;
      const bTime = b.readDate ? new Date(b.readDate + "T00:00:00").getTime() : 0;
      return bTime - aTime;
    };
    // readDate가 있는 책만 후보로 사용 (없는 책은 캐러셀 노출 제외)
    const writing = visibleBooks
      .filter((b) => b.status === "작성중" && b.readDate)
      .sort(byReadDateDesc)
      .slice(0, 3);
    const done = visibleBooks
      .filter((b) => b.status === "완료" && b.readDate)
      .sort(byReadDateDesc)
      .slice(0, 2);
    const waiting = visibleBooks
      .filter((b) => b.status === "대기" && b.readDate)
      .sort(byReadDateDesc)
      .slice(0, 3);
    return [...writing, ...done, ...waiting].sort(byReadDateDesc);
  }, [visibleBooks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleBooks.forEach((b) => {counts[b.category] = (counts[b.category] || 0) + 1;});
    return counts;
  }, [visibleBooks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleBooks.forEach((b) => {counts[b.status] = (counts[b.status] || 0) + 1;});
    return counts;
  }, [visibleBooks]);

  const filteredBooks = useMemo(() => {
    let result = visibleBooks;

    if (query.trim()) {
      const q = query.normalize("NFC").toLowerCase();
      result = result.filter(
        (b) =>
        b.title.normalize("NFC").toLowerCase().includes(q) ||
        b.author.normalize("NFC").toLowerCase().includes(q) ||
        b.tags.some((t) => t.normalize("NFC").toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }

    if (selectedStatus) {
      result = result.filter((b) => b.status === selectedStatus);
    }

    const statusPriority = (s: string) => (s === "작성중" ? 0 : s === "완료" ? 1 : 2);
    const readTime = (b: Book) => (b.readDate ? new Date(b.readDate + "T00:00:00").getTime() : 0);
    const updatedTime = (b: Book) => new Date(b.updatedAt).getTime();

    const userSort = (a: Book, b: Book) => {
      switch (sortOption) {
        case "title":
          return a.title.localeCompare(b.title, "ko");
        case "author":
          return a.author.localeCompare(b.author, "ko");
        case "newest":
        default:
          // 관리자 설정에 따른 기본 정렬
          if (mainSortMode === "read_date") return readTime(b) - readTime(a);
          if (mainSortMode === "updated") return updatedTime(b) - updatedTime(a);
          return readTime(b) - readTime(a);
      }
    };

    result = [...result].sort((a, b) => {
      // 상태값 우선 모드일 때만 상태 우선 정렬
      if (mainSortMode === "status_read_date" && sortOption === "newest") {
        const sp = statusPriority(a.status) - statusPriority(b.status);
        if (sp !== 0) return sp;
      }
      return userSort(a, b);
    });

    return result;
  }, [visibleBooks, query, selectedCategory, selectedStatus, sortOption, mainSortMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold text-foreground sm:text-4xl">
            <img
              src={ugenSymbol}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 rounded-full object-cover sm:hidden"
            />
            UGEN's Library
          </h1>
          <p className="mt-2 text-muted-foreground">
            읽고, 기록하는 공간
          </p>
        </div>

        {loading ? (
          <>
            <FeaturedCarouselSkeleton />
            <SearchFilterSkeleton />
            <BookGridSkeleton />
          </>
        ) : (
          <>
            <FeaturedCarousel books={featuredBooks} />

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
              categoryCounts={categoryCounts}
              statusCounts={statusCounts}
            />

            {filteredBooks.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredBooks.map((book, idx) =>
          <BookCard
            key={book.id}
            book={book}
            index={idx}
            liked={likedIds.has(book.id)}
            lastRevisionAt={revisionMap[book.id]}
            onToggleLike={handleToggleLike} />

          )}
              </div>
            ) : (
              <div className="mt-16 flex flex-col items-center justify-center text-center">
            <p className="font-serif text-xl text-muted-foreground">
              {books.length === 0 ?
            "아직 등록된 도서가 없습니다" :
            "검색 결과가 없습니다"}
            </p>
            {books.length === 0 &&
          <p className="mt-2 text-sm text-muted-foreground">
                관리 페이지에서 마크다운 파일을 업로드하여 시작하세요
              </p>
          }
              </div>
            )}
          </>
        )}
      </main>
    </div>);

};

export default Index;