import JSZip from "jszip";
import type { Book } from "@/types/book";

function buildFrontmatter(book: Book): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${book.title}"`);
  lines.push(`author: "${book.author}"`);
  lines.push(`category: "${book.category}"`);
  lines.push(`status: "${book.status}"`);
  if (book.bookcover) {
    lines.push(`bookcover: "${book.bookcover}"`);
  }
  if (book.tags && book.tags.length > 0) {
    lines.push("tags:");
    book.tags.forEach((tag) => {
      lines.push(`  - "${tag}"`);
    });
  }
  lines.push("---");
  return lines.join("\n");
}

export function bookToMarkdown(book: Book): string {
  const frontmatter = buildFrontmatter(book);
  const content = book.markdown || "";
  return `${frontmatter}\n${content}`;
}

export async function downloadBooksAsZip(books: Book[]) {
  const zip = new JSZip();

  for (const book of books) {
    const md = bookToMarkdown(book);
    const fileName = book.fileName || `${book.title}.md`;
    zip.file(fileName, md);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `books_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
