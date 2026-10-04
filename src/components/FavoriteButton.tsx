import { Star, Loader2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
export function FavoriteButton({
  bookId,
  title,
  compact = false,
}: {
  bookId: string;
  title: string;
  compact?: boolean;
}) {
  const { ids, toggle, loading, error, pending } = useFavorites();
  const saved = ids.includes(bookId);
  const busy = pending.has(bookId);
  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size={compact ? "icon" : "sm"}
      className={compact ? "card-favorite" : "detail-favorite"}
      aria-label={`${title.normalize("NFC")} 즐겨찾기 ${saved ? "해제" : "추가"}`}
      aria-pressed={saved}
      disabled={loading || busy || !!error}
      title={error || (saved ? "즐겨찾기 해제" : "즐겨찾기 추가")}
      onClick={() => void toggle(bookId)}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      )}{" "}
      {!compact && <span>{saved ? "즐겨찾기 해제" : "즐겨찾기 추가"}</span>}
    </Button>
  );
}
