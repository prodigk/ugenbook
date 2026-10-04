import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, X, Pencil, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BlogExportButtons } from "@/components/BlogExportButtons";
import { BookReadingControls } from "@/components/BookReadingControls";
import { ReadingAside } from "@/components/ReadingAside";
import { BookDetailSkeleton } from "@/components/skeletons/BookDetailSkeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { BookAdminActions } from "@/components/BookAdminActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchBookById, updateBookFields } from "@/lib/bookApi";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import type { Book } from "@/types/book";

const SUMMARIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-book`;

async function streamSummary(
  book: Book,
  onDelta: (text: string) => void,
  onDone: () => void,
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
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }
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

  // AI Summary state
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  // Author editing state
  const [editingAuthor, setEditingAuthor] = useState(false);
  const [authorValue, setAuthorValue] = useState("");
  const [savingAuthor, setSavingAuthor] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setBook(null);
    setSummary("");
    setEditingAuthor(false);
    fetchBookById(id)
      .then((value) => {
        if (!cancelled) setBook(value);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      toast({
        title: "업데이트 실패",
        description: String(e),
        variant: "destructive",
      });
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
        () => setSummarizing(false),
      );
    } catch (e) {
      toast({
        title: "요약 실패",
        description: String(e),
        variant: "destructive",
      });
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BookDetailSkeleton />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex flex-col items-center justify-center py-20">
          <p className="font-serif text-xl text-muted-foreground">
            도서를 찾을 수 없습니다
          </p>
          <Button variant="ghost" asChild className="mt-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> 책장으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container detail-main">
        <Button variant="ghost" size="sm" asChild className="detail-back">
          <Link to="/">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> 책장으로 돌아가기
          </Link>
        </Button>

        <div className="detail-hero">
          <div className="detail-cover-panel">
            <div className="detail-cover">
              {book.bookcover ? (
                <img
                  src={book.bookcover}
                  alt={book.title}
                  className="h-full w-full object-contain"
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

          <div className="detail-information">
            <p className="mono-label">BETWEEN THE PAGES / READING NOTES</p>
            <div className="detail-heading">
              <h1 className="detail-title">{book.title}</h1>
              <div className="detail-heading-actions">
                <FavoriteButton bookId={book.id} title={book.title} subtle />
                {isAdminEmail(user?.email) && (
                  <BookAdminActions book={book} onBookChange={setBook} />
                )}
              </div>
            </div>
            {book.isHidden && (
              <Badge variant="outline" className="mt-1 text-muted-foreground">
                숨김
              </Badge>
            )}
            {isAdminEmail(user?.email) && editingAuthor ? (
              <div className="detail-author flex items-center gap-2">
                <Input
                  aria-label="작가명"
                  value={authorValue}
                  onChange={(e) => setAuthorValue(e.target.value)}
                  placeholder="작가명을 입력하세요"
                  className="h-8 w-48 text-base"
                />
                <Button
                  size="sm"
                  aria-label="작가 정보 저장"
                  onClick={handleSaveAuthor}
                  disabled={savingAuthor}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="작가 편집 취소"
                  onClick={() => setEditingAuthor(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="detail-author flex items-center gap-2">
                <p className="text-lg text-muted-foreground">{book.author}</p>
                {isAdminEmail(user?.email) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="작가 정보 수정"
                    onClick={startEditingAuthor}
                    className="h-8 w-8 p-0 text-muted-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            <BookReadingControls
              key={book.id}
              book={book}
              canEdit={isAdminEmail(user?.email)}
              onChange={(fields) =>
                setBook((current) =>
                  current ? { ...current, ...fields } : current,
                )
              }
            />
            <div className="detail-tools">
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
          <div className="summary-panel" id="ai-summary">
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

        <section
          className="reading-layout"
          id="reading-notes"
          aria-labelledby="notes-heading"
        >
          <ReadingAside key={book.id} title={book.title} />
          <article className="reading-paper">
            <MarkdownRenderer content={book.markdown} />
          </article>
        </section>
      </main>
    </div>
  );
};

export default BookDetail;
