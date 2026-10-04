import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function BookDetailSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        도서 정보를 불러오는 중입니다.
      </p>
      <main
        id="main-content"
        className="container detail-main"
        aria-busy="true"
      >
        <Button variant="ghost" size="sm" asChild className="detail-back">
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> 책장으로 돌아가기
          </Link>
        </Button>
        <div className="detail-hero" aria-hidden="true">
          <div className="detail-cover-panel">
            <div className="detail-cover">
              <Skeleton className="h-full w-full rounded-sm bg-foreground/10" />
            </div>
          </div>
          <div className="detail-information">
            <p className="mono-label">BETWEEN THE PAGES / READING NOTES</p>
            <div className="detail-heading">
              <Skeleton className="skeleton-detail-title w-3/4" />
              <div className="detail-heading-actions">
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
            <div className="detail-author flex items-center">
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="book-metadata">
              <div className="flex flex-wrap gap-2">
                {[48, 54, 60, 70].map((width, i) => (
                  <Skeleton
                    key={i}
                    style={{ width }}
                    className="h-7 rounded-full"
                  />
                ))}
              </div>
              <div className="detail-dates">
                <div className="detail-date-item">
                  <span className="detail-date-label">읽은 날짜</span>
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="detail-date-item">
                  <span className="detail-date-label">최종 수정</span>
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
            <div className="detail-tools">
              <div className="flex flex-wrap gap-2">
                {[134, 154, 120].map((width, i) => (
                  <Skeleton
                    key={i}
                    style={{ width }}
                    className="h-10 rounded-full"
                  />
                ))}
              </div>
              <Skeleton className="h-10 w-[100px] rounded-full" />
            </div>
          </div>
        </div>
        <div className="reading-layout" aria-hidden="true">
          <aside className="reading-aside">
            <p className="mono-label">THE READING JOURNAL</p>
            <h2>
              책 속에서,
              <br /> 내 생각으로.
            </h2>
            <p>
              읽으며 남긴 문장과 생각을
              <br />
              차분히 따라가 보세요.
            </p>
            <Skeleton className="mt-8 h-4 w-20" />
          </aside>
          <div className="reading-paper space-y-10">
            {[0, 1, 2].map((section) => (
              <div key={section} className="space-y-4">
                {section > 0 && <Skeleton className="mb-6 h-7 w-2/5" />}
                {[100, 96, 100, 72].map((width, i) => (
                  <Skeleton
                    key={i}
                    style={{ width: `${width}%` }}
                    className="h-4"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
