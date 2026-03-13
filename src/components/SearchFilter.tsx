import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCategories } from "@/lib/categoryApi";
import type { BookCategory, BookStatus, SortOption } from "@/types/book";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "title", label: "제목순" },
  { value: "author", label: "저자순" },
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
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
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
        <div className="flex gap-1">
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
        </div>
      </div>
    </div>
  );
}
