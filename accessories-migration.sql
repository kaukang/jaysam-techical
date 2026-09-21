-- ==========================================================
-- JAYLIAM TECH: Products Features & Accessories Migration
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==========================================================

-- 1. Add `is_accessory` column to products table if not already present
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_accessory BOOLEAN DEFAULT false;

-- 2. Ensure `is_featured` column exists on products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 3. Create indexes to speed up filtering on featured and accessory products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_accessory ON public.products (is_accessory);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);

-- 4. Insert default 'Accessories' category if it does not already exist
INSERT INTO public.categories (name, slug, description, display_order, status)
VALUES (
  'Accessories',
  'accessories',
  'Phone cases, chargers, cables, screen protectors, adapters & peripherals',
  4,
  'active'
)
ON CONFLICT (slug) DO UPDATE
SET status = 'active',
    description = COALESCE(public.categories.description, EXCLUDED.description);

-- 5. Automatically tag existing accessory items based on keywords and assign category
DO $$
DECLARE
  v_accessories_category_id UUID;
BEGIN
  -- Get the Accessories category ID
  SELECT id INTO v_accessories_category_id 
  FROM public.categories 
  WHERE slug = 'accessories' 
  LIMIT 1;

  IF v_accessories_category_id IS NOT NULL THEN
    -- Tag products that match accessory keywords as is_accessory = true
    UPDATE public.products
    SET 
      is_accessory = true,
      category_id = COALESCE(category_id, v_accessories_category_id)
    WHERE 
      is_accessory IS NOT TRUE
      AND (
        LOWER(name) LIKE '%case%'
        OR LOWER(name) LIKE '%charger%'
        OR LOWER(name) LIKE '%cable%'
        OR LOWER(name) LIKE '%adapter%'
        OR LOWER(name) LIKE '%protector%'
        OR LOWER(name) LIKE '%power bank%'
        OR LOWER(name) LIKE '%headphone%'
        OR LOWER(name) LIKE '%earbud%'
        OR LOWER(name) LIKE '%accessory%'
        OR LOWER(name) LIKE '%accessories%'
      );

    -- Ensure brand is set to 'Accessories' instead of empty or store name 'JAYLIAM'
    UPDATE public.products
    SET brand = 'Accessories'
    WHERE 
      (is_accessory = true OR category_id = v_accessories_category_id)
      AND (brand IS NULL OR TRIM(brand) = '' OR LOWER(TRIM(brand)) = 'jayliam');
  END IF;
END $$;

-- 6. Verify changes
SELECT id, name, is_featured, is_accessory, category_id 
FROM public.products 
LIMIT 10;
