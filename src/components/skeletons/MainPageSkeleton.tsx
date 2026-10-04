import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedCarouselSkeleton() {
  return (
    <div className="featured-shelf skeleton-featured" aria-hidden="true">
      <div className="featured-title relative">
        <div>
          <p className="mono-label">ON MY DESK</p>
          <h2>요즘, 책장 위에는.</h2>
        </div>
        <span>최근 읽고 기록한 책들</span>
        <div className="skeleton-carousel-controls">
          <Skeleton />
          <Skeleton />
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex -ml-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="min-w-0 shrink-0 grow-0 pl-6 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <div className="featured-book">
                <Skeleton className="aspect-[2/3] w-20 shrink-0 rounded-sm" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-5 w-4/5" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-10 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-auto h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchFilterSkeleton() {
  return (
    <div className="catalog-filters" aria-hidden="true">
      <div className="collection-heading">
        <div>
          <span className="mono-label">THE COLLECTION</span>
          <h2>책장 둘러보기</h2>
        </div>
        <div className="catalog-search h-12">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full bg-secondary" />
          <Skeleton className="h-3 w-44 bg-secondary" />
        </div>
      </div>
      <div className="category-filters skeleton-categories">
        {[53, 94, 73, 73, 71, 67, 79, 83, 94, 81, 81, 69, 82, 63].map(
          (width, i) => (
            <Skeleton
              key={i}
              style={{ width }}
              className="shrink-0 rounded-full"
            />
          ),
        )}
      </div>
      <div className="catalog-toolbar">
        <div className="status-filters">
          <span>기록 상태</span>
          {[64, 76, 64].map((width, i) => (
            <Skeleton key={i} style={{ width }} className="h-9 rounded-full" />
          ))}
        </div>
        <div className="sort-controls">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>
      <div className="result-count">
        <Skeleton className="h-[18px] w-20" />
      </div>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="book-card" aria-hidden="true">
      <div className="book-cover-stage">
        <Skeleton className="h-full w-4/5 rounded-sm bg-foreground/10" />
      </div>
      <div className="book-card-title">
        <Skeleton className="h-6 w-5/6" />
      </div>
      <div className="book-card-author">
        <Skeleton className="h-[18px] w-1/2" />
      </div>
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({
  count = 10,
  grouped = false,
}: {
  count?: number;
  grouped?: boolean;
}) {
  const grid = (
    <div className="books-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
  return grouped ? (
    <div className="mt-8" aria-hidden="true">
      <div className="mb-4 border-b pb-2">
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="mb-3 h-6 w-12" />
      {grid}
    </div>
  ) : (
    grid
  );
}
