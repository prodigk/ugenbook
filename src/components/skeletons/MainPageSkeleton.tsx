import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedCarouselSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex shrink-0 basis-full gap-4 rounded-lg border-2 border-border bg-card p-4 md:basis-1/2 lg:basis-2/5"
          >
            <Skeleton className="aspect-[2/3] w-20 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-auto h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchFilterSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="mb-3 aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}