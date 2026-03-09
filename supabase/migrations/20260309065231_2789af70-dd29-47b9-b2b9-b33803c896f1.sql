ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_books_is_hidden ON public.books(is_hidden);