import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_book_metadata",
  title: "Update book metadata",
  description:
    "Update metadata for one book in the reading library: status, category, read date, tags, or visibility. Only the library owner can do this.",
  inputSchema: {
    id: z.string().trim().describe("Book id (uuid)."),
    status: z.enum(["작성중", "완료", "대기"]).optional().describe("New writing status."),
    category: z.string().trim().optional().describe("New category name."),
    read_date: z.string().trim().optional().describe("Read date as YYYY-MM-DD."),
    tags: z.array(z.string()).optional().describe("Replacement tag list."),
    is_hidden: z.boolean().optional().describe("Hide the book from the public library."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status, category, read_date, tags, is_hidden }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const fields: Record<string, unknown> = {};
    if (status !== undefined) fields.status = status;
    if (category !== undefined) fields.category = category.normalize("NFC");
    if (read_date !== undefined) fields.read_date = read_date;
    if (tags !== undefined) fields.tags = tags.map((t) => t.normalize("NFC"));
    if (is_hidden !== undefined) fields.is_hidden = is_hidden;

    if (Object.keys(fields).length === 0) {
      return { content: [{ type: "text", text: "No fields to update." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("books")
      .update(fields)
      .eq("id", id)
      .select("id,title,author,category,status,tags,read_date,is_hidden");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0) {
      return { content: [{ type: "text", text: "No book updated — check the id and your permissions." }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { book: data[0] },
    };
  },
});