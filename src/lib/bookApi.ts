import { supabase } from "@/integrations/supabase/client";
import { mdToBook } from "@/lib/frontmatter";
import type { Book, BookCategory } from "@/types/book";

type DbBook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  bookcover: string | null;
  tags: string[] | null;
  category: string;
  status: string;
  markdown: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  read_date: string | null;
};

function dbToBook(row: DbBook): Book {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    author: row.author,
    bookcover: row.bookcover || "",
    tags: row.tags || [],
    category: (row.category as BookCategory) || "기타",
    status: row.status as Book["status"],
    markdown: row.markdown,
    fileName: row.file_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readDate: row.read_date || undefined,
    isHidden: row.is_hidden,
  };
}

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToBook);
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToBook(data) : null;
}

export async function upsertBookFromMd(
  userId: string,
  fileName: string,
  rawMd: string
): Promise<Book> {
  const parsed = mdToBook(fileName, rawMd);

  // Check if book with same file_name exists for this user
  const { data: existing } = await supabase
    .from("books")
    .select("id")
    .eq("user_id", userId)
    .eq("file_name", fileName)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("books")
      .update({
        title: parsed.title,
        author: parsed.author,
        bookcover: parsed.bookcover,
        tags: parsed.tags,
        category: parsed.category,
        status: parsed.status,
        markdown: rawMd,
        read_date: parsed.readDate || null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return dbToBook(data);
  } else {
    const { data, error } = await supabase
      .from("books")
      .insert({
        user_id: userId,
        title: parsed.title,
        author: parsed.author,
        bookcover: parsed.bookcover,
        tags: parsed.tags,
        category: parsed.category,
        status: parsed.status,
        markdown: rawMd,
        file_name: fileName,
        read_date: parsed.readDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    return dbToBook(data);
  }
}

export async function updateBookcover(id: string, bookcover: string): Promise<void> {
  const { error } = await supabase
    .from("books")
    .update({ bookcover })
    .eq("id", id);
  if (error) throw error;
}

export async function checkDuplicateFileNames(
  userId: string,
  fileNames: string[]
): Promise<string[]> {
  const { data, error } = await supabase
    .from("books")
    .select("file_name")
    .eq("user_id", userId)
    .in("file_name", fileNames);

  if (error) throw error;
  return (data || []).map((r) => r.file_name);
}

export async function updateBookFields(
  id: string,
  fields: { category?: string; status?: string; author?: string; is_hidden?: boolean; read_date?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from("books")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBookById(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

/** 기존 도서의 마크다운에서 Date/date를 추출하여 read_date가 비어있는 경우 일괄 업데이트 */
export async function syncReadDatesFromMarkdown(): Promise<number> {
  const { data, error } = await supabase
    .from("books")
    .select("id, markdown, read_date")
    .is("read_date", null);

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  let updated = 0;
  for (const book of data) {
    const { parseFrontmatter } = await import("@/lib/frontmatter");
    const { data: fm } = parseFrontmatter(book.markdown);
    const dateVal = (fm.date as string) || (fm.Date as string);
    if (dateVal) {
      const { error: updateErr } = await supabase
        .from("books")
        .update({ read_date: dateVal })
        .eq("id", book.id);
      if (!updateErr) updated++;
    }
  }
  return updated;
}
