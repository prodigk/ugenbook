export type PreviewBook = {
  title: string;
  author: string | null;
  category: string | null;
  bookcover: string | null;
};

export function isValidBookId(id: string | null | undefined): id is string {
  return !!id && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
}

export function publicImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || /^[\d.]+$/.test(host) || host.startsWith("[")) return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function loadBookPreview(id: string): Promise<PreviewBook | null> {
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
