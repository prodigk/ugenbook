import { useEffect, useState } from "react";
import { Search, Link2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchCategories } from "@/lib/categoryApi";
import type { BookCategory, BookStatus, SortOption } from "@/types/book";
interface SearchFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedCategory: BookCategory | null;
  onCategoryChange: (c: BookCategory | null) => void;
  selectedStatus: BookStatus | null;
  onStatusChange: (s: BookStatus | null) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  onReset: () => void;
  totalCount: number;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
}
export function SearchFilter({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  sortOption,
  onSortChange,
  totalCount,
  categoryCounts,
  statusCounts,
  onReset,
}: SearchFilterProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats.map((c) => c.name)))
      .catch(() => setCategories(Object.keys(categoryCounts)));
  }, [categoryCounts]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "현재 책장 링크를 복사했습니다." });
    } catch {
      toast({ title: "복사 권한을 확인해 주세요.", variant: "destructive" });
    }
  };
  return (
    <section
      className="catalog-filters"
      aria-label="도서 검색 및 필터"
      id="collection"
    >
      <div className="collection-heading">
        <div>
          <span className="mono-label">THE COLLECTION</span>
          <h2>
            책장 둘러보기
            <span>
              {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
            </span>
          </h2>
        </div>
        <div className="catalog-search">
          <Search size={18} />
          <Input
            aria-label="도서 검색"
            placeholder="제목, 저자, 태그로 검색"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              aria-label="검색어 지우기"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="category-filters" role="group" aria-label="카테고리">
        <button
          aria-pressed={!selectedCategory}
          onClick={() => onCategoryChange(null)}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            aria-pressed={selectedCategory === cat}
            onClick={() =>
              onCategoryChange(
                selectedCategory === cat ? null : (cat as BookCategory),
              )
            }
          >
            {cat}
            <span>{categoryCounts[cat] || 0}</span>
          </button>
        ))}
      </div>
      <div className="catalog-toolbar">
        <div className="status-filters" role="group" aria-label="독서 상태">
          <span>기록 상태</span>
          {(["완료", "작성중", "대기"] as BookStatus[]).map((status) => (
            <button
              key={status}
              aria-pressed={selectedStatus === status}
              onClick={() =>
                onStatusChange(selectedStatus === status ? null : status)
              }
            >
              <i />
              {status}
              <span>{statusCounts[status] || 0}</span>
            </button>
          ))}
        </div>
        <div className="sort-controls">
          <label htmlFor="book-sort" className="sr-only">
            도서 정렬
          </label>
          <select
            id="book-sort"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            <option value="newest">최신순</option>
            <option value="title">제목순</option>
            <option value="author">저자순</option>
            <option value="dateGroup">연/월별</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            aria-label="현재 책장 링크 복사"
          >
            {copied ? <Check size={15} /> : <Link2 size={15} />}
            <span>링크 복사</span>
          </Button>
        </div>
      </div>
      <div className="result-count" role="status">
        <strong>{totalCount}</strong>권의 도서
        {(query || selectedCategory || selectedStatus) && (
          <button onClick={onReset}>
            필터 초기화 <X size={12} />
          </button>
        )}
      </div>
    </section>
  );
}
