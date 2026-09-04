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
import { sortBooksForMain } from "@/lib/mainSort";
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
    const noMama = (b: Book) => !b.tags.includes("엄마");
    // readDate가 있는 책만 후보로 사용 (없는 책은 캐러셀 노출 제외)
    const writing = visibleBooks
      .filter((b) => b.status === "작성중" && b.readDate && noMama(b))
      .sort(byReadDateDesc)
      .slice(0, 3);
    const done = visibleBooks
      .filter((b) => b.status === "완료" && b.readDate && noMama(b))
      .sort(byReadDateDesc)
      .slice(0, 2);
    const waiting = visibleBooks
      .filter((b) => b.status === "대기" && b.readDate && noMama(b))
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

    return sortBooksForMain(result, mainSortMode, sortOption === "dateGroup" ? "newest" : sortOption);
  }, [visibleBooks, query, selectedCategory, selectedStatus, sortOption, mainSortMode]);

  // 연/월별 보기: 읽은 날짜 기준 연도(크게) > 월(작게) 그룹, 최신순
  const dateGroups = useMemo(() => {
    if (sortOption !== "dateGroup") return [];
    const byTime = (a: Book, b: Book) => {
      const aT = a.readDate ? new Date(a.readDate + "T00:00:00").getTime() : 0;
      const bT = b.readDate ? new Date(b.readDate + "T00:00:00").getTime() : 0;
      return bT - aT;
    };
    const sorted = [...filteredBooks].sort(byTime);
    const years: { year: string; months: { month: string; books: Book[] }[] }[] = [];
    const noDate: Book[] = [];
    sorted.forEach((b) => {
      if (!b.readDate) { noDate.push(b); return; }
      const [y, m] = b.readDate.split("-");
      let yg = years.find((g) => g.year === y);
      if (!yg) { yg = { year: y, months: [] }; years.push(yg); }
      let mg = yg.months.find((g) => g.month === m);
      if (!mg) { mg = { month: m, books: [] }; yg.months.push(mg); }
      mg.books.push(b);
    });
    if (noDate.length) years.push({ year: "날짜 미지정", months: [{ month: "", books: noDate }] });
    return years;
  }, [filteredBooks, sortOption]);

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
              sortOption === "dateGroup" ? (
              <div className="mt-8 space-y-10">
                {dateGroups.map((yg) => (
                  <section key={yg.year}>
                    <h2 className="mb-4 font-serif text-2xl font-bold text-foreground border-b pb-2">
                      {yg.year === "날짜 미지정" ? yg.year : `${yg.year}년`}
                    </h2>
                    <div className="space-y-6">
                      {yg.months.map((mg) => (
                        <div key={mg.month || "nodate"}>
                          {mg.month && (
                            <h3 className="mb-3 font-serif text-base font-semibold text-muted-foreground">
                              {Number(mg.month)}월
                            </h3>
                          )}
                          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {mg.books.map((book, idx) => (
                              <BookCard
                                key={book.id}
                                book={book}
                                index={idx}
                                liked={likedIds.has(book.id)}
                                lastRevisionAt={revisionMap[book.id]}
                                onToggleLike={handleToggleLike} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              ) : (
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