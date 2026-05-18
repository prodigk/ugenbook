import { supabase } from "@/integrations/supabase/client";

export type MainSortMode = "read_date" | "updated" | "status_read_date";

export const DEFAULT_MAIN_SORT_MODE: MainSortMode = "status_read_date";

export async function fetchMainSortMode(): Promise<MainSortMode> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "main_sort_mode")
    .maybeSingle();
  if (error || !data) return DEFAULT_MAIN_SORT_MODE;
  const v = data.value as MainSortMode;
  if (v === "read_date" || v === "updated" || v === "status_read_date") return v;
  return DEFAULT_MAIN_SORT_MODE;
}

export async function setMainSortMode(mode: MainSortMode): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "main_sort_mode", value: mode, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}