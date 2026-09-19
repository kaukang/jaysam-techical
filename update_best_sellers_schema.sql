-- Create config table
CREATE TABLE IF NOT EXISTS public.best_sellers_config (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_active boolean DEFAULT true,
  mode text DEFAULT 'auto' CHECK (mode IN ('auto', 'manual')),
  limit_count integer DEFAULT 4,
  title text DEFAULT 'Our Best-Selling Products',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.best_sellers_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read best sellers config" ON public.best_sellers_config;
CREATE POLICY "Anyone can read best sellers config" ON public.best_sellers_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage best sellers config" ON public.best_sellers_config;
CREATE POLICY "Admins can manage best sellers config" ON public.best_sellers_config USING (public.is_admin());

INSERT INTO public.best_sellers_config (is_active, mode, limit_count, title)
SELECT true, 'auto', 4, 'Our Best-Selling Products'
WHERE NOT EXISTS (SELECT 1 FROM public.best_sellers_config);

-- Create products mapping table
CREATE TABLE IF NOT EXISTS public.best_seller_products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.best_seller_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read best seller products" ON public.best_seller_products;
CREATE POLICY "Anyone can read best seller products" ON public.best_seller_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage best seller products" ON public.best_seller_products;
CREATE POLICY "Admins can manage best seller products" ON public.best_seller_products USING (public.is_admin());

-- Create auto calculation function
CREATE OR REPLACE FUNCTION get_auto_best_sellers(limit_val integer)
RETURNS TABLE (
  product_id uuid,
  total_sold bigint
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    SUM(oi.quantity) as total_sold
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.order_status != 'cancelled'
  GROUP BY oi.product_id
  ORDER BY total_sold DESC
  LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
