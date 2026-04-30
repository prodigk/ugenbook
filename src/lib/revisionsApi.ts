import { supabase } from "@/integrations/supabase/client";

export type ChangeType =
  | "생성"
  | "본문 수정"
  | "제목 수정"
  | "상태 변경"
  | "카테고리 변경"
  | "태그 변경"
  | "작가 수정"
  | "표지 변경"
  | "읽은 날짜 변경"
  | "메타데이터 수정";

export interface BookRevision {
  id: string;
  bookId: string;
  changeType: ChangeType | string;
  createdAt: string;
}

export async function fetchBookRevisions(bookId: string): Promise<BookRevision[]> {
  const { data, error } = await supabase
    .from("book_revisions")
    .select("id, book_id, change_type, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    bookId: r.book_id,
    changeType: r.change_type,
    createdAt: r.created_at,
  }));
}

export async function fetchLatestRevisionMap(
  bookIds: string[]
): Promise<Record<string, string>> {
  if (bookIds.length === 0) return {};
  const { data, error } = await supabase
    .from("book_revisions")
    .select("book_id, created_at")
    .in("book_id", bookIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data || []) {
    if (!map[row.book_id]) map[row.book_id] = row.created_at;
  }
  return map;
}

export async function logRevision(
  bookId: string,
  userId: string,
  changeType: ChangeType
): Promise<void> {
  const { error } = await supabase
    .from("book_revisions")
    .insert({ book_id: bookId, user_id: userId, change_type: changeType });
  if (error) console.error("revision log failed", error);
}
