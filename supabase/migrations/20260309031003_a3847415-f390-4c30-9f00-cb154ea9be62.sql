
DROP POLICY IF EXISTS "Books are publicly readable" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

CREATE POLICY "Books are publicly readable" ON public.books FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own books" ON public.books FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Publish records are publicly readable" ON public.publish_records;
DROP POLICY IF EXISTS "Users can insert their own publish records" ON public.publish_records;

CREATE POLICY "Publish records are publicly readable" ON public.publish_records FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own publish records" ON public.publish_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
