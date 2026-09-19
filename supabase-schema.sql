-- ==========================================
-- JAYLIAM TECH SUPABASE SCHEMA
-- Execute this script in your Supabase SQL Editor
-- ==========================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Handle automatic profile creation on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. Create Categories Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  status text default 'active' check (status in ('active', 'inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  brand text,
  description text,
  short_description text,
  price numeric(10, 2) not null,
  old_price numeric(10, 2),
  sku text unique,
  stock_quantity integer default 0,
  specifications jsonb default '{}'::jsonb,
  is_featured boolean default false,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Product Images Table
create table public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  is_primary boolean default false,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) default 0,
  total numeric(10, 2) not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  order_status text default 'pending' check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Order Items Table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null,
  price numeric(10, 2) not null,
  total numeric(10, 2) not null
);

-- 8. Create Homepage Management Tables
create table public.hero_sections (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  headline text not null,
  highlighted_text text,
  description text,
  primary_btn_text text,
  primary_btn_link text,
  secondary_btn_text text,
  secondary_btn_link text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  btn_text text,
  btn_link text,
  status text default 'active' check (status in ('active', 'inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.testimonials (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  location text,
  rating integer check (rating >= 1 and rating <= 5),
  content text not null,
  image_url text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.services (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  icon_name text,
  status text default 'active' check (status in ('active', 'inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.about_content (
  id uuid default uuid_generate_v4() primary key,
  heading text not null,
  description text not null,
  image_url text,
  years_experience integer default 0,
  happy_customers_count text,
  genuine_products_stat text,
  support_stat text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.site_settings (
  id uuid default uuid_generate_v4() primary key,
  business_name text not null default 'JAYLIAM TECH',
  logo_url text,
  phone text,
  email text,
  address text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  footer_text text,
  currency text default 'KSh',
  delivery_info text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.hero_sections enable row level security;
alter table public.banners enable row level security;
alter table public.testimonials enable row level security;
alter table public.services enable row level security;
alter table public.about_content enable row level security;
alter table public.site_settings enable row level security;

-- Create Admin Check Function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- PROFILES Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins can update all profiles" on public.profiles for update using (public.is_admin());
create policy "Admins can delete profiles" on public.profiles for delete using (public.is_admin());

-- PUBLIC READ Policies (For active content)
create policy "Anyone can read active categories" on public.categories for select using (status = 'active' or public.is_admin());
create policy "Anyone can read active products" on public.products for select using (status = 'active' or public.is_admin());
create policy "Anyone can read product images" on public.product_images for select using (true);
create policy "Anyone can read active hero sections" on public.hero_sections for select using (is_active = true or public.is_admin());
create policy "Anyone can read active banners" on public.banners for select using (status = 'active' or public.is_admin());
create policy "Anyone can read active testimonials" on public.testimonials for select using (status = 'active' or public.is_admin());
create policy "Anyone can read active services" on public.services for select using (status = 'active' or public.is_admin());
create policy "Anyone can read about content" on public.about_content for select using (true);
create policy "Anyone can read site settings" on public.site_settings for select using (true);

-- ADMIN FULL ACCESS Policies (Insert, Update, Delete)
create policy "Admins can manage categories" on public.categories using (public.is_admin());
create policy "Admins can manage products" on public.products using (public.is_admin());
create policy "Admins can manage product images" on public.product_images using (public.is_admin());
create policy "Admins can manage hero sections" on public.hero_sections using (public.is_admin());
create policy "Admins can manage banners" on public.banners using (public.is_admin());
create policy "Admins can manage testimonials" on public.testimonials using (public.is_admin());
create policy "Admins can manage services" on public.services using (public.is_admin());
create policy "Admins can manage about content" on public.about_content using (public.is_admin());
create policy "Admins can manage site settings" on public.site_settings using (public.is_admin());

-- ORDERS Policies
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins can view all orders" on public.orders for select using (public.is_admin());
create policy "Admins can update all orders" on public.orders for update using (public.is_admin());
create policy "Admins can delete orders" on public.orders for delete using (public.is_admin());

create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Users can insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Admins can view all order items" on public.order_items for select using (public.is_admin());
create policy "Admins can manage order items" on public.order_items using (public.is_admin());

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;

-- Storage Policies
create policy "Anyone can view media" on storage.objects for select using (bucket_id = 'media');
create policy "Admins can insert media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "Admins can update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "Admins can delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- Insert default site settings
insert into public.site_settings (business_name) values ('JAYLIAM TECH') on conflict do nothing;
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
