CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are publicly readable"
ON public.app_settings FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert settings"
ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
ON public.app_settings FOR UPDATE TO authenticated USING (true);

INSERT INTO public.app_settings (key, value) VALUES ('main_sort_mode', 'status_read_date')
ON CONFLICT (key) DO NOTHING;