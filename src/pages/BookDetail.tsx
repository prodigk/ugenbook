import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BlogExportButtons } from "@/components/BlogExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBooks } from "@/lib/bookStore";
import type { Book } from "@/types/book";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const books = getBooks();
    const found = books.find((b) => b.id === id);
    setBook(found || null);
  }, [id]);

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex flex-col items-center justify-center py-20">
          <p className="font-serif text-xl text-muted-foreground">도서를 찾을 수 없습니다</p>
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> 목록
          </Link>
        </Button>

        {/* Book Header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row">
          {/* Cover */}
          <div className="w-full shrink-0 sm:w-48">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
              {book.bookcover ? (
                <img
                  src={book.bookcover}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary p-4">
                  <span className="text-center font-serif text-lg text-secondary-foreground/70">
                    {book.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">{book.author}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{book.category}</Badge>
              <Badge variant={book.status === "완료" ? "default" : "outline"}>
                {book.status}
              </Badge>
              {book.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              최종 수정: {new Date(book.updatedAt).toLocaleDateString("ko-KR")}
            </div>

            {/* Blog export */}
            <div className="mt-4">
              <BlogExportButtons book={book} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg border bg-card p-6 sm:p-8">
          <MarkdownRenderer content={book.markdown} />
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
