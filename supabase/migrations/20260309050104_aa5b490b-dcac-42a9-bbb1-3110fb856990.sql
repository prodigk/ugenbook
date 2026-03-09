-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user_file ON public.books(user_id, file_name);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON public.books(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_records_book_id ON public.publish_records(book_id);
CREATE INDEX IF NOT EXISTS idx_publish_records_user_id ON public.publish_records(user_id);

-- Attach updated_at trigger (function exists but trigger was missing)
DROP TRIGGER IF EXISTS set_updated_at ON public.books;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();