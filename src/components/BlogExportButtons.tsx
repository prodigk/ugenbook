import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { toNaverHtml, toBrunchText, copyToClipboard } from "@/lib/blogExport";
import type { Book } from "@/types/book";

interface BlogExportButtonsProps {
  book: Book;
}

export function BlogExportButtons({ book }: BlogExportButtonsProps) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleNaverCopy}>
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        네이버 블로그 복사
      </Button>
      <Button variant="outline" size="sm" onClick={handleBrunchCopy}>
        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
        브런치 복사
      </Button>
    </div>
  );
}
