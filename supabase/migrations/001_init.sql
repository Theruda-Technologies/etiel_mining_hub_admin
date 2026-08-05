-- Etiel Mining Hub Admin — initial schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

-- Roles: super_admin | admin
create type public.app_role as enum ('super_admin', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'operator',
  status text not null default 'active' check (status in ('active', 'suspended', 'invited')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sku text not null unique,
  price numeric(12, 2) not null default 0,
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  description text not null default '',
  image_url text,
  specs jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  rate_label text not null default 'Hourly Rate (USD)',
  rate numeric(12, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  icon text not null default 'headset',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  status text not null default 'Pending'
    check (status in ('Processed', 'Pending', 'Failed', 'Processing')),
  buyer_full_name text not null default '',
  buyer_company text not null default '',
  buyer_email text not null default '',
  buyer_phone text not null default '',
  shipping_address text[] not null default '{}',
  notes text not null default '',
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  name text not null,
  description text not null default '',
  sku text not null default '',
  qty integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  image_url text,
  sort_order integer not null default 0
);

create table if not exists public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  title text not null,
  event_date date not null default current_date,
  description text not null default '',
  is_active boolean not null default false,
  sort_order integer not null default 0
);

-- Auto-create profile when auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.app_role;
begin
  selected_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'role', '')::public.app_role,
    'admin'::public.app_role
  );

  insert into public.profiles (id, email, full_name, role, invited_by)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    selected_role,
    nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('super_admin', 'admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and status = 'active'
  );
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in ('super_admin', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_timeline enable row level security;

drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff" on public.profiles
  for select to authenticated
  using (public.is_staff());

drop policy if exists "profiles_update_self_or_super" on public.profiles;
create policy "profiles_update_self_or_super" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

drop policy if exists "products_select_staff" on public.products;
create policy "products_select_staff" on public.products
  for select to authenticated using (public.is_staff());

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all to authenticated
  using (public.is_admin_or_above())
  with check (public.is_admin_or_above());

drop policy if exists "services_select_staff" on public.services;
create policy "services_select_staff" on public.services
  for select to authenticated using (public.is_staff());

drop policy if exists "services_write_admin" on public.services;
create policy "services_write_admin" on public.services
  for all to authenticated
  using (public.is_admin_or_above())
  with check (public.is_admin_or_above());

drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff" on public.orders
  for select to authenticated using (public.is_staff());

drop policy if exists "orders_write_staff" on public.orders;
create policy "orders_write_staff" on public.orders
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "order_items_select_staff" on public.order_items;
create policy "order_items_select_staff" on public.order_items
  for select to authenticated using (public.is_staff());

drop policy if exists "order_items_write_staff" on public.order_items;
create policy "order_items_write_staff" on public.order_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "order_timeline_select_staff" on public.order_timeline;
create policy "order_timeline_select_staff" on public.order_timeline
  for select to authenticated using (public.is_staff());

drop policy if exists "order_timeline_write_staff" on public.order_timeline;
create policy "order_timeline_write_staff" on public.order_timeline
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Seed catalog / order demo rows (safe to re-run)
insert into public.products (title, sku, price, status, description, image_url, specs)
values
  (
    'MAGNETAR Drill X',
    'DRL-X9-882',
    84500,
    'active',
    'Heavy-duty rotary drill platform for deep-core mineral sampling in remote extraction sites.',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=240&h=240&fit=crop',
    '[{"id":"1","key":"Power Output","value":"450 kW"},{"id":"2","key":"Depth Rating","value":"1,200m"}]'::jsonb
  ),
  (
    'Titan Conveyor C',
    'CNV-T400-E',
    12000,
    'draft',
    'Modular overland conveyor section for high-volume ore transfer between crushers and stockpiles.',
    null,
    '[{"id":"1","key":"Belt Width","value":"1,200 mm"},{"id":"2","key":"Capacity","value":"2,400 t/h"}]'::jsonb
  )
on conflict (sku) do nothing;

insert into public.services (title, rate_label, rate, status, icon)
select * from (values
  ('24/7 Field Support', 'Hourly Rate (USD)', 250.00, 'active', 'headset'),
  ('Operator Certification', 'Course Fee (USD)', 1500.00, 'active', 'gradcap')
) as v(title, rate_label, rate, status, icon)
where not exists (select 1 from public.services s where s.title = v.title);

insert into public.orders (
  id, status, buyer_full_name, buyer_company, buyer_email, buyer_phone,
  shipping_address, notes, subtotal, tax, shipping, total
) values (
  'ORD-9021',
  'Processed',
  'Marcus Vance',
  'Apex Global Extraction',
  'm.vance@apexglobal.ext',
  '+61 8 9555 0142',
  array[
    'Apex Global Extraction — Site 4',
    'Lot 12, Pilbara Access Road',
    'Newman WA 6753',
    'Australia'
  ],
  '',
  148600,
  0,
  0,
  148600
)
on conflict (id) do nothing;

insert into public.order_items (order_id, name, description, sku, qty, unit_price, image_url, sort_order)
select * from (values
  (
    'ORD-9021',
    'MAGNETAR Drill X-9',
    'Heavy Duty Core Drilling Unit',
    'MGX-900-V2',
    1,
    145000::numeric,
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=120&h=120&fit=crop',
    0
  ),
  (
    'ORD-9021',
    'Tungsten Replacement Teeth Set',
    'Pack of 50',
    'TRT-50-P',
    3,
    1200::numeric,
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=120&h=120&fit=crop',
    1
  )
) as v(order_id, name, description, sku, qty, unit_price, image_url, sort_order)
where not exists (
  select 1 from public.order_items oi where oi.order_id = v.order_id and oi.sku = v.sku
);

insert into public.order_timeline (order_id, title, event_date, description, is_active, sort_order)
select * from (values
  (
    'ORD-9021',
    'Order Processed',
    '2023-10-24'::date,
    'Payment verified by finance. Order released to fulfillment and logistics.',
    true,
    0
  ),
  (
    'ORD-9021',
    'Payment Received',
    '2023-10-23'::date,
    'Wire transfer confirmed. TxID: WX-8821-APX-44.',
    false,
    1
  ),
  (
    'ORD-9021',
    'Order Placed',
    '2023-10-22'::date,
    'Order submitted via web portal by Marcus Vance.',
    false,
    2
  )
) as v(order_id, title, event_date, description, is_active, sort_order)
where not exists (
  select 1 from public.order_timeline ot where ot.order_id = v.order_id and ot.title = v.title
);
