-- 도서 변경 이력 테이블
CREATE TABLE public.book_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_book_revisions_book_id_created_at
  ON public.book_revisions(book_id, created_at DESC);

ALTER TABLE public.book_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Revisions are publicly readable"
ON public.book_revisions
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own revisions"
ON public.book_revisions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revisions"
ON public.book_revisions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 도서당 최근 20건만 유지하는 함수 + 트리거
CREATE OR REPLACE FUNCTION public.trim_book_revisions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.book_revisions
  WHERE book_id = NEW.book_id
    AND id NOT IN (
      SELECT id FROM public.book_revisions
      WHERE book_id = NEW.book_id
      ORDER BY created_at DESC
      LIMIT 20
    );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trim_book_revisions_trigger
AFTER INSERT ON public.book_revisions
FOR EACH ROW
EXECUTE FUNCTION public.trim_book_revisions();