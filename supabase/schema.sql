-- NAZARYA Full Stack setup for Supabase
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  collection text default 'DROP 001',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_no_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('NZ-' || nextval('public.order_no_seq')::text),
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  payment_method text not null default 'COD',
  subtotal integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  status text not null default 'new' check (status in ('new','confirmed','shipped','completed','cancelled')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'main',
  announcement text,
  hero_title text,
  hero_subtitle text,
  hero_button_text text,
  hero_button_link text,
  hero_image_url text,
  about_title text,
  about_text text,
  instagram_handle text,
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt()->>'email',''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter enable row level security;

-- Public storefront can read active products.
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select using (is_active or public.is_admin());
drop policy if exists "admin manage products" on public.products;
create policy "admin manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anyone can place an order, only admins can read/update/delete orders.
drop policy if exists "public create orders" on public.orders;
create policy "public create orders" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete orders" on public.orders;
create policy "admin delete orders" on public.orders for delete to authenticated using (public.is_admin());

-- Site settings are public read, admin write.
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
drop policy if exists "admin manage settings" on public.site_settings;
create policy "admin manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Newsletter signup is public; only admins can list subscribers.
drop policy if exists "public newsletter signup" on public.newsletter;
create policy "public newsletter signup" on public.newsletter for insert to anon, authenticated with check (true);
drop policy if exists "admin read newsletter" on public.newsletter;
create policy "admin read newsletter" on public.newsletter for select to authenticated using (public.is_admin());

-- Admins table can only be read by authenticated admins.
drop policy if exists "admin read admins" on public.admins;
create policy "admin read admins" on public.admins for select to authenticated using (public.is_admin());

-- Public product image bucket. Admin-only writes.
insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public=true;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select using (bucket_id='product-images');
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.is_admin());
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects for update to authenticated using (bucket_id='product-images' and public.is_admin()) with check (bucket_id='product-images' and public.is_admin());
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.is_admin());

-- Seed the homepage and initial catalog from the supplied design.
insert into public.site_settings (id,announcement,hero_title,hero_subtitle,hero_button_text,hero_button_link,about_title,about_text,instagram_handle)
values ('main','FREE DELIVERY ON ALL ORDERS ABOVE PKR 5,000','WEAR YOUR IDENTITY','Clothing that reflects who you are.','SHOP NOW','#shop','ABOUT NAZARYA','Nazarya is more than clothing — it’s a reflection of mindset, culture and purity in style. Every piece is designed for those who carry confidence with humility.','@NAZARYA.OFFICIAL')
on conflict (id) do nothing;

insert into public.products (name,sku,price,stock,image_url,sort_order)
values
('NOIR ESSENTIAL BLACK TEE','NZ-NOIR-001',3490,20,'assets/images/product1.jpg',1),
('HERITAGE OLIVE TEE','NZ-OLIVE-001',3490,20,'assets/images/product2.jpg',2),
('SAHARA SAND TEE','NZ-SAND-001',3490,20,'assets/images/product3.jpg',3),
('GRAPHITE CHARCOAL TEE','NZ-CHAR-001',3490,20,'assets/images/product4.jpg',4),
('PURE IVORY TEE','NZ-IVORY-001',3490,20,'assets/images/product5.jpg',5),
('LEGACY BACK PRINT TEE','NZ-LEGACY-001',3990,20,'assets/images/product6.jpg',6)
on conflict (sku) do nothing;

-- IMPORTANT: replace the email below with YOUR admin email before running this line.
-- insert into public.admins(email) values ('your-email@example.com') on conflict do nothing;
