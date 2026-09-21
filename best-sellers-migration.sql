-- Migration: Add is_best_seller to products and ensure RLS permissions for Best Sellers
-- Run this in your Supabase SQL Editor if you want database-level indexing and column support

-- 1. Add is_best_seller column to products if not exists
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller 
ON public.products (is_best_seller);

-- 3. Ensure best_sellers_config table exists
CREATE TABLE IF NOT EXISTS public.best_sellers_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('auto', 'manual')),
    limit_count INTEGER NOT NULL DEFAULT 8 CHECK (limit_count > 0 AND limit_count <= 24),
    title TEXT NOT NULL DEFAULT 'Our Best-Selling Products',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Ensure best_seller_products table exists
CREATE TABLE IF NOT EXISTS public.best_seller_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_best_seller_product UNIQUE(product_id)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.best_sellers_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_seller_products ENABLE ROW LEVEL SECURITY;

-- 6. Public read access
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view best sellers config' AND tablename = 'best_sellers_config') THEN
        CREATE POLICY "Public can view best sellers config" ON public.best_sellers_config FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view best seller products' AND tablename = 'best_seller_products') THEN
        CREATE POLICY "Public can view best seller products" ON public.best_seller_products FOR SELECT USING (true);
    END IF;
END $$;

-- 7. Admin read/write policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage best sellers config" ON public.best_sellers_config;
    CREATE POLICY "Admins can manage best sellers config" ON public.best_sellers_config 
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated') 
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Admins can manage best seller products" ON public.best_seller_products;
    CREATE POLICY "Admins can manage best seller products" ON public.best_seller_products 
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated') 
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');
END $$;

-- 8. Insert initial default config if empty
INSERT INTO public.best_sellers_config (is_active, mode, limit_count, title)
SELECT true, 'manual', 8, 'Our Best-Selling Products'
WHERE NOT EXISTS (SELECT 1 FROM public.best_sellers_config);
