import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ImageIcon,
  Check,
  X,
  Pencil,
  Sparkles,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Header } from "@/components/Header";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { BlogExportButtons } from "@/components/BlogExportButtons";
import { BookTagEditor } from "@/components/BookTagEditor";
import { BookAdminActions } from "@/components/BookAdminActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReadDateCalendar } from "@/components/ReadDateCalendar";
import {
  fetchBookById,
  updateBookcover,
  updateBookFields,
} from "@/lib/bookApi";
import { fetchUserLikes } from "@/lib/likesApi";
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

  // Like state
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchBookById(id)
      .then(setBook)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !user || !isAdminEmail(user.email)) return;
    fetchUserLikes(user.id).then((ids) => setLiked(ids.includes(id)));
  }, [id, user]);

  const handleSaveCover = async () => {
    if (!book) return;
    setSaving(true);
    try {
      await updateBookcover(book.id, coverUrl);
      setBook({ ...book, bookcover: coverUrl });
      setEditingCover(false);
      toast({ title: "북커버 이미지가 업데이트되었습니다." });
    } catch (e) {
      toast({
        title: "업데이트 실패",
        description: String(e),
        variant: "destructive",
      });
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
        <div className="container py-20 text-center text-muted-foreground">
          불러오는 중...
        </div>
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
            <h1 className="detail-title">{book.title}</h1>
            {book.isHidden && (
              <Badge variant="outline" className="mt-1 text-muted-foreground">
                숨김
              </Badge>
            )}
            {isAdminEmail(user?.email) && (
              <div className="mt-2">
                <BookAdminActions
                  book={book}
                  userId={user!.id}
                  liked={liked}
                  onLikeChange={setLiked}
                  onBookChange={setBook}
                />
              </div>
            )}
            {isAdminEmail(user?.email) && editingAuthor ? (
              <div className="mt-1 flex items-center gap-2">
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
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg text-muted-foreground">{book.author}</p>
                {isAdminEmail(user?.email) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="작가 정보 수정"
                    onClick={startEditingAuthor}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{book.category}</Badge>
              {isAdminEmail(user?.email) ? (
                <BookTagEditor
                  type="status"
                  value={book.status}
                  onUpdate={async (newStatus) => {
                    try {
                      await updateBookFields(book.id, { status: newStatus });
                      setBook({ ...book, status: newStatus as Book["status"] });
                      toast({
                        title: `상태가 "${newStatus}"로 변경되었습니다.`,
                      });
                    } catch (e) {
                      toast({
                        title: "상태 변경 실패",
                        description: String(e),
                        variant: "destructive",
                      });
                    }
                  }}
                />
              ) : (
                <Badge variant={book.status === "완료" ? "default" : "outline"}>
                  {book.status}
                </Badge>
              )}
              {book.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                최종 수정:{" "}
                {new Date(book.updatedAt).toLocaleDateString("ko-KR")}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                읽은 날짜:&nbsp;
                {isAdminEmail(user?.email) ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 text-xs"
                      >
                        {book.readDate
                          ? new Date(
                              book.readDate + "T00:00:00",
                            ).toLocaleDateString("ko-KR")
                          : "미지정"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <ReadDateCalendar
                        selected={
                          book.readDate
                            ? new Date(book.readDate + "T00:00:00")
                            : undefined
                        }
                        onSelect={async (date) => {
                          if (!date) return;
                          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                          try {
                            await updateBookFields(book.id, {
                              read_date: dateStr,
                            });
                            setBook({ ...book, readDate: dateStr });
                            toast({ title: "읽은 날짜가 업데이트되었습니다." });
                          } catch (e) {
                            toast({
                              title: "업데이트 실패",
                              description: String(e),
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span>
                    {book.readDate
                      ? new Date(
                          book.readDate + "T00:00:00",
                        ).toLocaleDateString("ko-KR")
                      : "미지정"}
                  </span>
                )}
              </span>
            </div>

            {/* Bookcover URL display & edit - only visible to owner */}
            {isAdminEmail(user?.email) && (
              <div className="cover-editor">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ImageIcon className="h-4 w-4" />
                  표지 이미지
                </div>
                {editingCover ? (
                  <div className="mt-2 flex gap-2">
                    <Input
                      aria-label="표지 이미지 URL"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="이미지 URL을 입력하세요"
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      aria-label="표지 저장"
                      onClick={handleSaveCover}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="표지 편집 취소"
                      onClick={() => setEditingCover(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    {book.bookcover ? (
                      <p className="flex-1 truncate text-xs text-muted-foreground">
                        {book.bookcover}
                      </p>
                    ) : (
                      <p className="flex-1 text-xs text-destructive">
                        표지이미지 업데이트 필요
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditing}
                      className="shrink-0"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {book.bookcover ? "수정" : "추가"}
                    </Button>
                  </div>
                )}
              </div>
            )}

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
          <aside className="reading-aside">
            <p className="mono-label">THE READING JOURNAL</p>
            <h2 id="notes-heading">
              책 속에서,
              <br />내 생각으로.
            </h2>
            <p>
              읽으며 남긴 문장과 생각을
              <br />
              차분히 따라가 보세요.
            </p>
            <a href="#main-content">도서 정보로 ↑</a>
          </aside>
          <article className="reading-paper">
            <MarkdownRenderer content={book.markdown} />
          </article>
        </section>
      </main>
    </div>
  );
};

export default BookDetail;
