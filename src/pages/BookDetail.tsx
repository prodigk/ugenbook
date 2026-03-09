import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ImageIcon, Check, X, Pencil } from "lucide-react";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BlogExportButtons } from "@/components/BlogExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBookById, updateBookcover } from "@/lib/bookApi";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCover, setEditingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveCover = async () => {
    if (!book) return;
    setSaving(true);
    try {
      await updateBookcover(book.id, coverUrl);
      setBook({ ...book, bookcover: coverUrl });
      setEditingCover(false);
      toast({ title: "북커버 이미지가 업데이트되었습니다." });
    } catch (e) {
      toast({ title: "업데이트 실패", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setCoverUrl(book?.bookcover || "");
    setEditingCover(true);
  };

// ... keep existing code

            <div className="mt-4 text-xs text-muted-foreground">
              최종 수정: {new Date(book.updatedAt).toLocaleDateString("ko-KR")}
            </div>

            {/* Bookcover URL display & edit */}
            <div className="mt-4 rounded-md border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ImageIcon className="h-4 w-4" />
                표지 이미지
              </div>
              {editingCover ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="이미지 URL을 입력하세요"
                    className="flex-1 text-sm"
                  />
                  <Button size="sm" onClick={handleSaveCover} disabled={saving}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCover(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  {book.bookcover ? (
                    <p className="flex-1 truncate text-xs text-muted-foreground">{book.bookcover}</p>
                  ) : (
                    <p className="flex-1 text-xs text-destructive">표지이미지 업데이트 필요</p>
                  )}
                  <Button size="sm" variant="outline" onClick={startEditing} className="shrink-0">
                    <Pencil className="mr-1 h-3 w-3" />
                    {book.bookcover ? "수정" : "추가"}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <BlogExportButtons book={book} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 sm:p-8">
          <MarkdownRenderer content={book.markdown} />
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
