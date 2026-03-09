import { useState } from "react";
import { Copy, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { toNaverHtml, toBrunchText, copyToClipboard } from "@/lib/blogExport";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { Book } from "@/types/book";

const GENERATE_BLOG_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blog`;

interface BlogExportButtonsProps {
  book: Book;
}

async function streamBlog(
  book: Book,
  onDelta: (text: string) => void,
  onDone: () => void
) {
  const resp = await fetch(GENERATE_BLOG_URL, {
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
    const err = await resp.json().catch(() => ({ error: "블로그 글 생성 실패" }));
    throw new Error(err.error || "블로그 글 생성 실패");
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
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Final flush
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export function BlogExportButtons({ book }: BlogExportButtonsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blogContent, setBlogContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleNaverCopy = async () => {
    const html = toNaverHtml(book);
    const success = await copyToClipboard(html);
    if (success) {
      toast({ title: "네이버 블로그용 HTML이 복사되었습니다", description: "블로그 에디터의 HTML 모드에 붙여넣기 하세요." });
    } else {
      toast({ title: "복사 실패", description: "브라우저 권한을 확인해주세요.", variant: "destructive" });
    }
  };

  const handleBrunchCopy = async () => {
    const text = toBrunchText(book);
    const success = await copyToClipboard(text);
    if (success) {
      toast({ title: "브런치용 텍스트가 복사되었습니다", description: "브런치 에디터에 붙여넣기 하세요." });
    } else {
      toast({ title: "복사 실패", description: "브라우저 권한을 확인해주세요.", variant: "destructive" });
    }
  };

  const handleGenerateBlog = async () => {
    if (generating) return;
    setGenerating(true);
    setBlogContent("");
    setDialogOpen(true);
    let accumulated = "";
    try {
      await streamBlog(
        book,
        (chunk) => {
          accumulated += chunk;
          setBlogContent(accumulated);
        },
        () => setGenerating(false)
      );
    } catch (e) {
      toast({ title: "블로그 글 생성 실패", description: String(e), variant: "destructive" });
      setGenerating(false);
    }
  };

  const handleCopyBlog = async () => {
    const success = await copyToClipboard(blogContent);
    if (success) {
      toast({ title: "블로그 글이 복사되었습니다", description: "네이버 블로그 에디터에 붙여넣기 하세요." });
    } else {
      toast({ title: "복사 실패", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleGenerateBlog} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          AI 블로그 작성
        </Button>
        <Button variant="outline" size="sm" onClick={handleNaverCopy}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          네이버 블로그 복사
        </Button>
        <Button variant="outline" size="sm" onClick={handleBrunchCopy}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          브런치 복사
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 블로그 글
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {blogContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={blogContent} />
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                블로그 글을 작성하고 있습니다...
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              닫기
            </Button>
            <Button size="sm" onClick={handleCopyBlog} disabled={generating || !blogContent}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              복사하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
