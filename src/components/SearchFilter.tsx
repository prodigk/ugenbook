import { useEffect, useState } from "react";
import { Search, Link2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchCategories } from "@/lib/categoryApi";
import type { BookCategory, BookStatus, SortOption } from "@/types/book";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "title", label: "제목순" },
  { value: "author", label: "저자순" },
  { value: "dateGroup", label: "연/월별" },
];

interface SearchFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedCategory: BookCategory | null;
  onCategoryChange: (c: BookCategory | null) => void;
  selectedStatus: BookStatus | null;
  onStatusChange: (s: BookStatus | null) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
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
}: SearchFilterProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCategories().then((cats) => setCategories(cats.map((c) => c.name)));
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: "링크가 복사되었습니다", description: "현재 필터/정렬 상태가 포함된 링크입니다." });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "복사 실패", description: "클립보드 권한을 확인해주세요.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="제목, 저자, 태그로 검색..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Categories */}
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onCategoryChange(null)}
        >
          전체 {totalCount}
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange(selectedCategory === cat ? null : cat as BookCategory)}
          >
            {cat} {categoryCounts[cat] || 0}
          </Badge>
        ))}

        <span className="mx-2 h-4 w-px bg-border" />

        {/* Status */}
        <Badge
          variant={selectedStatus === "완료" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange(selectedStatus === "완료" ? null : "완료")}
        >
          완료 {statusCounts["완료"] || 0}
        </Badge>
        <Badge
          variant={selectedStatus === "작성중" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange(selectedStatus === "작성중" ? null : "작성중")}
        >
          작성중 {statusCounts["작성중"] || 0}
        </Badge>
        <Badge
          variant={selectedStatus === "대기" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onStatusChange(selectedStatus === "대기" ? null : "대기")}
        >
          대기 {statusCounts["대기"] || 0}
        </Badge>
      </div>

      {/* Sort & count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalCount}권의 도서</p>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={sortOption === opt.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSortChange(opt.value)}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs gap-1"
            title="현재 필터/정렬 상태 링크 복사"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            링크 복사
          </Button>
        </div>
      </div>
    </div>
  );
}
