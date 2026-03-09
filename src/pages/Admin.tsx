import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBooks, upsertBookFromMd, deleteBookById, updateBookFields, checkDuplicateFileNames } from "@/lib/bookApi";
import { BookTagEditor } from "@/components/BookTagEditor";
import type { Book } from "@/types/book";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Duplicate confirmation state
  const [duplicateFiles, setDuplicateFiles] = useState<File[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

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

  const uploadFiles = async (files: File[]) => {
    if (!user) return 0;
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
    return successCount;
  };

  const handleFilesSelected = async (files: File[]) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Check for duplicates
      const fileNames = files.map((f) => f.name);
      const existingNames = await checkDuplicateFileNames(user.id, fileNames);

      const newFiles = files.filter((f) => !existingNames.includes(f.name));
      const dupes = files.filter((f) => existingNames.includes(f.name));

      // Upload new files first
      let successCount = 0;
      if (newFiles.length > 0) {
        successCount = await uploadFiles(newFiles);
        const updated = await fetchBooks();
        setBooks(updated);
        if (successCount > 0) {
          toast({
            title: `${successCount}개 신규 파일 업로드 완료`,
            description: "도서 목록이 업데이트되었습니다.",
          });
        }
      }

      // If there are duplicates, show confirmation dialog
      if (dupes.length > 0) {
        setDuplicateFiles(dupes);
        setShowDuplicateDialog(true);
      }
    } catch (err) {
      toast({ title: "파일 처리 중 오류", description: String(err), variant: "destructive" });
    } finally {
      if (!duplicateFiles.length) {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmDuplicates = async () => {
    setShowDuplicateDialog(false);
    const count = await uploadFiles(duplicateFiles);
    const updated = await fetchBooks();
    setBooks(updated);
    setDuplicateFiles([]);
    setIsProcessing(false);
    if (count > 0) {
      toast({
        title: `${count}개 중복 파일 업데이트 완료`,
        description: "기존 도서가 최신 내용으로 업데이트되었습니다.",
      });
    }
  };

  const handleCancelDuplicates = () => {
    setShowDuplicateDialog(false);
    setDuplicateFiles([]);
    setIsProcessing(false);
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

        <PaginatedBookList books={books} loading={loading} onDelete={handleDelete} onUpdateBooks={setBooks} />
      </main>

      {/* Duplicate confirmation dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={(open) => { if (!open) handleCancelDuplicates(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              중복 파일 발견
            </DialogTitle>
            <DialogDescription>
              다음 {duplicateFiles.length}개 파일이 이미 등록되어 있습니다. 최신 내용으로 업데이트하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border bg-muted p-3">
            {duplicateFiles.map((f) => (
              <p key={f.name} className="text-sm text-foreground">📄 {f.name}</p>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDuplicates}>
              건너뛰기
            </Button>
            <Button onClick={handleConfirmDuplicates}>
              업데이트
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

function PaginatedBookList({
  books,
  loading,
  onDelete,
  onUpdateBooks,
}: {
  books: Book[];
  loading: boolean;
  onDelete: (id: string) => void;
  onUpdateBooks: React.Dispatch<React.SetStateAction<Book[]>>;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(books.length / ITEMS_PER_PAGE));

  // Reset to page 1 if books change and current page is out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [books.length, totalPages, page]);

  const paginatedBooks = useMemo(
    () => books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [books, page]
  );

  return (
    <section>
      <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
        등록된 도서 ({books.length}권)
      </h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : books.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 도서가 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedBooks.map((book) => (
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
                    <Link
                      to={`/book/${book.id}`}
                      className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {book.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                  <BookTagEditor
                    type="category"
                    value={book.category}
                    onUpdate={async (val) => {
                      try {
                        await updateBookFields(book.id, { category: val });
                        onUpdateBooks((prev) =>
                          prev.map((b) => b.id === book.id ? { ...b, category: val as Book["category"] } : b)
                        );
                      } catch (err) {
                        toast({ title: "카테고리 변경 실패", description: String(err), variant: "destructive" });
                      }
                    }}
                  />
                  <BookTagEditor
                    type="status"
                    value={book.status}
                    onUpdate={async (val) => {
                      try {
                        await updateBookFields(book.id, { status: val });
                        onUpdateBooks((prev) =>
                          prev.map((b) => b.id === book.id ? { ...b, status: val as Book["status"] } : b)
                        );
                      } catch (err) {
                        toast({ title: "상태 변경 실패", description: String(err), variant: "destructive" });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(book.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </section>
  );
}

const PAGES_VISIBLE = 10;

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  // Calculate visible page range (up to 10 pages)
  const startPage = Math.max(1, Math.min(page - Math.floor(PAGES_VISIBLE / 2), totalPages - PAGES_VISIBLE + 1));
  const endPage = Math.min(totalPages, startPage + PAGES_VISIBLE - 1);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="text-xs"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        이전
      </Button>

      {startPage > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)} className="h-8 w-8 p-0 text-xs">
            1
          </Button>
          {startPage > 2 && <span className="px-1 text-muted-foreground text-xs">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(p)}
          className="h-8 w-8 p-0 text-xs"
        >
          {p}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-muted-foreground text-xs">…</span>}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)} className="h-8 w-8 p-0 text-xs">
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="text-xs"
      >
        다음
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

export default Admin;
