import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBooks, upsertBookFromMd, deleteBookById } from "@/lib/bookApi";
import type { Book } from "@/types/book";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (!user) return;
    setIsProcessing(true);

    let successCount = 0;
    for (const file of files) {
      try {
        const raw = await file.text();
        await upsertBookFromMd(user.id, file.name, raw);
        successCount++;
      } catch (err) {
        toast({
          title: `${file.name} 처리 실패`,
          description: String(err),
          variant: "destructive",
        });
      }
    }

    // Refresh list
    const updated = await fetchBooks();
    setBooks(updated);
    setIsProcessing(false);
    if (successCount > 0) {
      toast({
        title: `${successCount}개 파일 처리 완료`,
        description: "도서 목록이 업데이트되었습니다.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookById(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "도서가 삭제되었습니다" });
    } catch (err) {
      toast({ title: "삭제 실패", description: String(err), variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-8">
        <h1 className="mb-6 font-serif text-2xl font-bold text-foreground">
          도서 관리
        </h1>

        <section className="mb-8">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            마크다운 파일 업로드
          </h2>
          <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            등록된 도서 ({books.length}권)
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : books.length === 0 ? (
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
