import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { fetchBookRevisions, type BookRevision } from "@/lib/revisionsApi";

interface Props {
  bookId: string;
  refreshKey?: number;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookRevisionHistory({ bookId, refreshKey }: Props) {
  const [revisions, setRevisions] = useState<BookRevision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBookRevisions(bookId)
      .then((rows) => {
        if (!cancelled) setRevisions(rows);
      })
      .catch(console.error)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [bookId, refreshKey]);

  const lastUpdated = revisions[0]?.createdAt;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4" />
        변경 이력
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      {lastUpdated && (
        <p className="mt-1 text-xs text-muted-foreground">
          마지막 업데이트: {formatDateTime(lastUpdated)}
        </p>
      )}
      {!loading && revisions.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">아직 기록된 변경 이력이 없습니다.</p>
      )}
      {revisions.length > 0 && (
        <ul className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {revisions.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
            >
              <span className="font-medium text-foreground">{r.changeType}</span>
              <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
