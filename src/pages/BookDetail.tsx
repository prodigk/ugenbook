import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ImageIcon, Check, X, Pencil, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BlogExportButtons } from "@/components/BlogExportButtons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBookById, updateBookcover, updateBookFields } from "@/lib/bookApi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

const SUMMARIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-book`;

async function streamSummary(
  book: Book,
  onDelta: (text: string) => void,
  onDone: () => void
) {
  const resp = await fetch(SUMMARIZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      title: book.title,
      author: book.author,
      markdown: book.markdown,
    }),
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "요약 생성 실패" }));
    throw new Error(err.error || "요약 생성 실패");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const BookDetail = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCover, setEditingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Summary state
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  // Author editing state
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [authorValue, setAuthorValue] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchBookById(id)
      .then(setBook)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  const startEditingAuthor = () => {
    setAuthorValue(book?.author || "");
    setEditingAuthor(true);
  };

  const handleSaveAuthor = async () => {
    if (!book) return;
    setSavingAuthor(true);
    try {
      await updateBookFields(book.id, { author: authorValue });
      setBook({ ...book, author: authorValue });
      setEditingAuthor(false);
      toast({ title: "작가 정보가 업데이트되었습니다." });
    } catch (e) {
      toast({ title: "업데이트 실패", description: String(e), variant: "destructive" });
    } finally {
      setSavingAuthor(false);
    }
  };

  const handleSummarize = async () => {
    if (!book || summarizing) return;
    setSummarizing(true);
    setSummary("");
    let accumulated = "";
    try {
      await streamSummary(
        book,
        (chunk) => {
          accumulated += chunk;
          setSummary(accumulated);
        },
        () => setSummarizing(false)
      );
    } catch (e) {
      toast({ title: "요약 실패", description: String(e), variant: "destructive" });
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center text-muted-foreground">불러오는 중...</div>
      </div>
    );
  }

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

        <div className="mb-8 flex flex-col gap-6 sm:flex-row">
          <div className="w-full shrink-0 sm:w-48">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
              {book.bookcover ? (
                <img src={book.bookcover} alt={book.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary p-4">
                  <span className="text-center font-serif text-lg text-secondary-foreground/70">
                    {book.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              {book.title}
            </h1>
            {isAdminEmail(user?.email) && editingAuthor ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={authorValue}
                  onChange={(e) => setAuthorValue(e.target.value)}
                  placeholder="작가명을 입력하세요"
                  className="h-8 w-48 text-base"
                />
                <Button size="sm" onClick={handleSaveAuthor} disabled={savingAuthor}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingAuthor(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg text-muted-foreground">{book.author}</p>
                {isAdminEmail(user?.email) && (
                  <Button size="sm" variant="ghost" onClick={startEditingAuthor} className="h-6 w-6 p-0">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{book.category}</Badge>
              <Badge variant={book.status === "완료" ? "default" : "outline"}>
                {book.status}
              </Badge>
              {book.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              최종 수정: {new Date(book.updatedAt).toLocaleDateString("ko-KR")}
            </div>

            {/* Bookcover URL display & edit - only visible to owner */}
            {isAdminEmail(user?.email) && (
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
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <BlogExportButtons book={book} />
              <Button
                onClick={handleSummarize}
                disabled={summarizing}
                variant="outline"
                size="sm"
              >
                {summarizing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                AI 요약
              </Button>
            </div>
          </div>
        </div>

        {/* AI Summary section */}
        {(summary || summarizing) && (
          <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              AI 요약
              {summarizing && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-6 sm:p-8">
          <MarkdownRenderer content={book.markdown} />
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
