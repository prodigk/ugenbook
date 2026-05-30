import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Book } from "@/types/book";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { toggleLike } from "@/lib/likesApi";

interface BookCardProps {
  book: Book;
  index: number;
  liked?: boolean;
  lastRevisionAt?: string;
  onToggleLike?: (bookId: string, newLiked: boolean) => void;
}

export const BookCard = memo(function BookCard({ book, index, liked = false, lastRevisionAt, onToggleLike }: BookCardProps) {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [isLiked, setIsLiked] = useState(liked);
  const [toggling, setToggling] = useState(false);

  const isRecentlyUpdated = lastRevisionAt
    ? Date.now() - new Date(lastRevisionAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  const hasMamaTag = book.tags.some((t) => t === "엄마");

  // Sync with parent prop
  useEffect(() => {setIsLiked(liked);}, [liked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || toggling) return;
    setToggling(true);
    try {
      await toggleLike(user.id, book.id, isLiked);
      const newLiked = !isLiked;
      setIsLiked(newLiked);
      onToggleLike?.(book.id, newLiked);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group block book-card-hover"
      style={{ animationDelay: `${index * 60}ms` }}>
      
      <div className="animate-fade-in opacity-0">
        <div className={book.status === "대기" ? "opacity-70" : ""}>
        <div className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-muted mb-3 ${
          hasMamaTag
            ? "ring-[5px] ring-[hsl(340,80%,70%)]"
            : book.status === "대기"
            ? "ring-1 ring-muted-foreground/20"
            : ""}`
          }>
          {book.bookcover ?
            <img
              src={book.bookcover}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 shadow-md"
              loading="lazy" /> :


            <div className="flex h-full w-full items-center justify-center bg-secondary p-4">
              <span className="text-center font-serif text-lg text-secondary-foreground/70">
                {book.title}
              </span>
            </div>
            }
          {isAdmin &&
            <button
              onClick={handleLike}
              className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
              aria-label={isLiked ? "좋아요 취소" : "좋아요"}>
              
              <Heart
                className={`h-4 w-4 transition-colors ${
                isLiked ?
                "fill-destructive text-destructive" :
                "text-muted-foreground"}`
                } />
              
            </button>
            }
        </div>
        <h3 className="font-serif text-base font-semibold leading-tight text-foreground line-clamp-2">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs font-normal">
            {book.category}
          </Badge>
          {book.status === "작성중" &&
            <Badge variant="outline" className="text-xs font-normal">
              작성중
            </Badge>
            }
          {isRecentlyUpdated && (
            <Badge className="text-xs font-normal bg-primary/15 text-primary hover:bg-primary/15">
              업데이트됨
            </Badge>
          )}
        </div>
        </div>
      </div>
    </Link>);

});