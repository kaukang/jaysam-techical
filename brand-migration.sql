-- ==========================================
-- BRANDS MIGRATION
-- ==========================================

-- 1. Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Anyone can read active brands" ON public.brands
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage brands" ON public.brands
  USING (public.is_admin());

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
