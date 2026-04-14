import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { Book } from "@/types/book";

interface FeaturedCarouselProps {
  books: Book[];
}

function stripFrontmatter(raw: string): string {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return m ? m[1] : raw;
}

function getPreview(markdown: string, maxLen = 80): string {
  const body = stripFrontmatter(markdown).trim();
  // Remove markdown syntax for preview
  const plain = body
    .replace(/^#+\s+/gm, "")
    .replace(/[*_~`>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/==(.+?)==/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (!plain) return "";
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

const statusStyle: Record<string, string> = {
  "작성중": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "대기": "bg-muted text-muted-foreground",
  "완료": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export function FeaturedCarousel({ books }: FeaturedCarouselProps) {
  if (books.length === 0) return null;

  return (
    <div className="mb-6">
      <Carousel opts={{ align: "start", loop: books.length > 1 }} className="w-full">
        <CarouselContent className="-ml-3">
          {books.map((book) => {
            const preview = getPreview(book.markdown);
            return (
              <CarouselItem key={book.id} className="pl-3 basis-full md:basis-1/2 lg:basis-1/3">
                <Link to={`/book/${book.id}`} className="block">
                  <div className={`flex gap-4 rounded-lg border-2 bg-card p-4 transition-transform hover:scale-[1.02] hover:shadow-md ${
                    book.status === "작성중"
                      ? "border-amber-400 dark:border-amber-500"
                      : book.status === "대기"
                      ? "border-violet-400 dark:border-violet-500"
                      : "border-border"
                  }`}>
                    {/* Cover */}
                    <div className="w-20 shrink-0">
                      {book.bookcover ? (
                        <img
                          src={book.bookcover}
                          alt={book.title}
                          className="aspect-[2/3] w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-muted p-1">
                          <span className="text-center text-xs font-medium text-muted-foreground line-clamp-3">
                            {book.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="font-serif text-base font-bold text-foreground line-clamp-1">
                        {book.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {book.category}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${statusStyle[book.status] || ""}`}>
                          {book.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                      {preview && (
                        <p className="mt-auto text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                          {preview}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {books.length > 1 && (
          <>
            <CarouselPrevious className="-left-4 h-7 w-7" />
            <CarouselNext className="-right-4 h-7 w-7" />
          </>
        )}
      </Carousel>
    </div>
  );
}
