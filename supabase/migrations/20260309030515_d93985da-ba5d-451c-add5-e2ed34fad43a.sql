
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Books table (public read, admin write)
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '미상',
  bookcover TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT '기타',
  status TEXT NOT NULL DEFAULT '작성중',
  markdown TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Anyone can read books
CREATE POLICY "Books are publicly readable"
  ON public.books FOR SELECT USING (true);

-- Only the owner can insert/update/delete
CREATE POLICY "Users can insert their own books"
  ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON public.books FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON public.books FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Publish records table
CREATE TABLE public.publish_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  publish_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.publish_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publish records are publicly readable"
  ON public.publish_records FOR SELECT USING (true);

CREATE POLICY "Users can insert their own publish records"
  ON public.publish_records FOR INSERT WITH CHECK (auth.uid() = user_id);
