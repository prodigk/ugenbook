import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_books",
  title: "Search books",
  description:
    "Search the reading library for books by title, author, or tag. Returns metadata (title, author, category, status, read date), not the full note body.",
  inputSchema: {
    query: z.string().trim().optional().describe("Text matched against title and author."),
    status: z.enum(["작성중", "완료", "대기"]).optional().describe("Filter by writing status."),
    category: z.string().trim().optional().describe("Filter by category name."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, status, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("books")
      .select("id,title,author,category,status,tags,read_date,updated_at,is_hidden")
      .order("updated_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));

    if (status) q = q.eq("status", status);
    if (category) q = q.eq("category", category);
    if (query) {
      const term = query.normalize("NFC").replace(/[%,]/g, " ").trim();
      if (term) q = q.or(`title.ilike.%${term}%,author.ilike.%${term}%`);
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { books: data ?? [] },
    };
  },
});