import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addCategory(name: string, sortOrder: number): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, fields: { name?: string; sort_order?: number }): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
