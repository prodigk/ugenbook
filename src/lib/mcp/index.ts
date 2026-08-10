import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchBooksTool from "./tools/search-books";
import getBookTool from "./tools/get-book";
import listCategoriesTool from "./tools/list-categories";
import updateBookTool from "./tools/update-book";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bookreview-sync",
  title: "BookReview Sync",
  version: "0.1.0",
  instructions:
    "Tools for the UGEN 책장 reading library. Use `search_books` to find books by title, author, status, or category; `get_book` to read a book's full markdown reading note; `list_categories` for the category list; and `update_book_metadata` to change a book's status, category, read date, tags, or visibility.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchBooksTool, getBookTool, listCategoriesTool, updateBookTool],
});