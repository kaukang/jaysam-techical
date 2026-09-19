-- Migration: Add Responsive Banner Support for Mobile, Tablet, and Desktop
-- Run this in your Supabase SQL Editor if you want database-level persistence of responsive banner images.

-- 1. Hero Sections Table Updates
ALTER TABLE IF EXISTS public.hero_sections 
  ADD COLUMN IF NOT EXISTS image_url_tablet text,
  ADD COLUMN IF NOT EXISTS image_url_mobile text;

-- 2. Banners Table Updates
ALTER TABLE IF EXISTS public.banners 
  ADD COLUMN IF NOT EXISTS image_url_tablet text,
  ADD COLUMN IF NOT EXISTS image_url_mobile text,
  ADD COLUMN IF NOT EXISTS secondary_btn_text text,
  ADD COLUMN IF NOT EXISTS secondary_btn_link text,
  ADD COLUMN IF NOT EXISTS show_text_overlay boolean DEFAULT true;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
