import { Link } from "react-router-dom";
import type { Book } from "@/types/book";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: Book;
  index: number;
}

export function BookCard({ book, index }: BookCardProps) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group block book-card-hover"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="animate-fade-in opacity-0">
        <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted mb-3">
          {book.bookcover ? (
            <img
              src={book.bookcover}
              alt={book.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
        <h3 className="font-serif text-base font-semibold leading-tight text-foreground line-clamp-2">
          {book.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs font-normal">
            {book.category}
          </Badge>
          {book.status === "작성중" && (
            <Badge variant="outline" className="text-xs font-normal">
              작성중
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
