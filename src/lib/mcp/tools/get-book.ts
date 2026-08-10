import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_book",
  title: "Get book note",
  description:
    "Fetch one book from the reading library including its full markdown reading note. Look up by id, or by exact title.",
  inputSchema: {
    id: z.string().trim().optional().describe("Book id (uuid)."),
    title: z.string().trim().optional().describe("Exact book title, used when no id is given."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, title }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!id && !title) {
      return { content: [{ type: "text", text: "Provide either id or title." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase.from("books").select("*").limit(1);
    q = id ? q.eq("id", id) : q.eq("title", title!.normalize("NFC"));

    const { data, error } = await q.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Book not found." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { book: data },
    };
  },
});