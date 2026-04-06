import type { Book } from "@/types/book";

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1] : raw;
}

/** Convert markdown to simple HTML for Naver blog */
export function toNaverHtml(book: Book): string {
  let html = stripFrontmatter(book.markdown);

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  html = html.replace(/\*(.+?)\*/g, "<i>$1</i>");

  // Highlights (==text==)
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

  // Line breaks
  html = html.replace(/\n\n/g, "<br/><br/>");

  const wrapper = `
<div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.8; color: #333;">
  <h1 style="font-size: 24px; margin-bottom: 8px;">${book.title}</h1>
  <p style="color: #888; margin-bottom: 24px;">저자: ${book.author}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
  ${html}
</div>`.trim();

  return wrapper;
}

/** Convert markdown to brunch-optimized format for clipboard */
export function toBrunchText(book: Book): string {
  let text = `${book.title}\n저자: ${book.author}\n\n---\n\n`;

  let body = stripFrontmatter(book.markdown);

  // Remove markdown syntax, keep readable text
  body = body.replace(/^#{1,6} /gm, "");
  body = body.replace(/\*\*(.+?)\*\*/g, "$1");
  body = body.replace(/\*(.+?)\*/g, "$1");
  body = body.replace(/==(.+?)==/g, "$1");
  body = body.replace(/^> /gm, "");
  body = body.replace(/^- /gm, "• ");

  text += body;
  return text;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
