import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { shortCodeToBookId } from "../src/lib/shareLink.js";

type Request = IncomingMessage & { query?: Record<string, string | string[] | undefined> };
type PreviewBook = { title: string; author: string | null; category: string | null; bookcover: string | null };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

function publicImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function renderBookMetaHtml(template: string, book: PreviewBook, pageUrl: string): string {
  const title = escapeHtml(book.title);
  const description = escapeHtml(
    [book.author && `작가 ${book.author}`, book.category && `분야 ${book.category}`]
      .filter(Boolean)
      .join(" · ") || "UGENs 책장",
  );
  const image = publicImageUrl(book.bookcover);
  const imageTags = image ? `
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${title} 표지" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />` : "";
  const tags = `<meta property="og:type" content="book" />
    <meta property="og:site_name" content="UGENs 책장" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />${imageTags}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />`;

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${title} | UGENs 책장</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace("<!-- BOOK_META -->", tags);
}

async function loadTemplate(): Promise<string> {
  try {
    return await readFile(join(process.cwd(), "dist/index.html"), "utf8");
  } catch {
    const deployment = process.env.VERCEL_URL;
    if (!deployment) throw new Error("Built HTML is unavailable");
    const response = await fetch(`https://${deployment}/index.html`);
    if (!response.ok) throw new Error(`Built HTML returned ${response.status}`);
    return response.text();
  }
}

async function loadBook(id: string): Promise<PreviewBook | null> {
  const baseUrl = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !key) throw new Error("Supabase environment variables are missing");

  const url = new URL("/rest/v1/books", baseUrl);
  url.searchParams.set("select", "title,author,category,bookcover");
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("limit", "1");
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Book lookup returned ${response.status}`);
  const books = (await response.json()) as PreviewBook[];
  return books[0] ?? null;
}

export default async function handler(request: Request, response: ServerResponse): Promise<void> {
  const idParam = first(request.query?.id);
  const code = first(request.query?.code);
  const id = code ? shortCodeToBookId(code) : idParam;
  const validId = id && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);

  try {
    const template = await loadTemplate();
    const book = validId ? await loadBook(id) : null;
    const host = request.headers.host;
    const safeHost = host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : "ugenbook.vercel.app";
    const path = code ? `/s/${code}` : `/book/${idParam ?? ""}`;
    const html = book ? renderBookMetaHtml(template, book, `https://${safeHost}${path}`) : template;

    response.statusCode = book ? 200 : 404;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    response.end(html);
  } catch (error) {
    console.error("Book preview failed", error);
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("도서 페이지를 불러오지 못했습니다.");
  }
}
