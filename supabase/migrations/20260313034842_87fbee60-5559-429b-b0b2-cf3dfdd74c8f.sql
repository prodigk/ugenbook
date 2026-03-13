
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT TO public
  USING (true);

-- Only authenticated users can manage (admin check done in app)
CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (true);

-- Seed existing categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('경제', 1),
  ('인문', 2),
  ('사회과학', 3),
  ('커리어', 4),
  ('철학', 5),
  ('자기계발', 6),
  ('문학', 7),
  ('과학', 8),
  ('기타', 9);
