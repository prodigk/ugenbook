
-- Helper: check if current user is the admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'email') = 'ugen.kwon@gmail.com', false);
$$;

-- app_settings: restrict writes to admin
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.app_settings;

CREATE POLICY "Admin can insert settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete settings"
ON public.app_settings FOR DELETE TO authenticated
USING (public.is_admin());

-- categories: restrict writes to admin
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='categories'
      AND cmd IN ('INSERT','UPDATE','DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admin can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.is_admin());

-- books: hide is_hidden from public
DROP POLICY IF EXISTS "Books are publicly readable" ON public.books;

CREATE POLICY "Books are readable when not hidden or by admin"
ON public.books FOR SELECT
USING (is_hidden = false OR public.is_admin());
