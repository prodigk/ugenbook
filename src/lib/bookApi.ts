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
        markdown: parsed.markdown,
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
        markdown: parsed.markdown,
        file_name: fileName,
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

export async function deleteBookById(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}
