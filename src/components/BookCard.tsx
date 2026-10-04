import { memo } from "react";
import { Link } from "react-router-dom";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { Book } from "@/types/book";
import { Badge } from "@/components/ui/badge";
interface BookCardProps {
  book: Book;
  index: number;
  lastRevisionAt?: string;
}

export const BookCard = memo(function BookCard({
  book,
  lastRevisionAt,
}: BookCardProps) {
  const isRecentlyUpdated = lastRevisionAt
    ? Date.now() - new Date(lastRevisionAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  const hasMamaTag = book.tags.some((t) => t === "엄마");

  return (
    <article className="group block book-card relative">
      <FavoriteButton bookId={book.id} title={book.title} compact />
      <Link to={`/book/${book.id}`} className="block">
        <div className="book-card-inner">
          <div className={book.status === "대기" ? "opacity-70" : ""}>
            <div
              className={`book-cover-stage ${hasMamaTag ? "family-book" : ""}`}
            >
              {book.bookcover ? (
                <img
                  src={book.bookcover}
                  alt={book.title}
                  className="book-cover-image"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary p-4">
                  <span className="text-center font-serif text-lg text-secondary-foreground/70">
                    {book.title}
                  </span>
                </div>
              )}
            </div>
            <h3 className="book-card-title">{book.title}</h3>
            <p className="book-card-author">{book.author}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs font-normal">
                {book.category}
              </Badge>
              {book.status === "작성중" && (
                <Badge variant="outline" className="text-xs font-normal">
                  작성중
                </Badge>
              )}
              {isRecentlyUpdated && (
                <Badge className="text-xs font-normal bg-primary/15 text-primary hover:bg-primary/15">
                  업데이트됨
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
});
