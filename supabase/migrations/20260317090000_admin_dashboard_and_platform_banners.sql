-- Admin moderation metadata for reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- HTML/CSS/JS banners managed from admin panel
CREATE TABLE IF NOT EXISTS public.platform_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  html_content text NOT NULL,
  css_content text,
  js_content text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active platform banners" ON public.platform_banners;
CREATE POLICY "Anyone can read active platform banners"
ON public.platform_banners
FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage platform banners" ON public.platform_banners;
CREATE POLICY "Admins can manage platform banners"
ON public.platform_banners
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_platform_banners_updated_at ON public.platform_banners;
CREATE TRIGGER update_platform_banners_updated_at
  BEFORE UPDATE ON public.platform_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
