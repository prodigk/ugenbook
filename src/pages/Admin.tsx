import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getBooks, addOrUpdateBook, deleteBook } from "@/lib/bookStore";
import { mdToBook } from "@/lib/frontmatter";
import type { Book } from "@/types/book";

const Admin = () => {
  const [books, setBooks] = useState<Book[]>(() => getBooks());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    let updatedBooks = getBooks();

    for (const file of files) {
      try {
        const raw = await file.text();
        const book = mdToBook(file.name, raw);
        updatedBooks = addOrUpdateBook(book);
      } catch (err) {
        toast({
          title: `${file.name} 처리 실패`,
          description: String(err),
          variant: "destructive",
        });
      }
    }

    setBooks(updatedBooks);
    setIsProcessing(false);
    toast({
      title: `${files.length}개 파일 처리 완료`,
      description: "도서 목록이 업데이트되었습니다.",
    });
  };

  const handleDelete = (id: string) => {
    const updated = deleteBook(id);
    setBooks(updated);
    toast({ title: "도서가 삭제되었습니다" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
          도서 관리
        </h1>

        {/* Upload */}
        <section className="mb-8">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            마크다운 파일 업로드
          </h2>
          <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </section>

        {/* Book list */}
        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            등록된 도서 ({books.length}권)
          </h2>
          {books.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 도서가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {book.bookcover && (
                      <img
                        src={book.bookcover}
                        alt=""
                        className="h-12 w-8 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {book.category}
                    </Badge>
                    <Badge
                      variant={book.status === "완료" ? "default" : "outline"}
                      className="shrink-0 text-xs"
                    >
                      {book.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/book/${book.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(book.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admin;
