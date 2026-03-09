import { supabase } from "@/integrations/supabase/client";

export async function fetchUserLikes(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("likes")
    .select("book_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((r) => r.book_id);
}

export async function toggleLike(userId: string, bookId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: userId, book_id: bookId });
    if (error) throw error;
  }
}
