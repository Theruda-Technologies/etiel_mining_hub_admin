-- Catalog categories table (source of truth for product/service category options).

create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product', 'service')),
  value text not null,
  label text not null,
  label_am text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint catalog_categories_kind_value_key unique (kind, value)
);

create index if not exists catalog_categories_kind_sort_idx
  on public.catalog_categories (kind, sort_order, value);

alter table public.catalog_categories enable row level security;

drop policy if exists "catalog_categories_read_authenticated" on public.catalog_categories;
create policy "catalog_categories_read_authenticated"
  on public.catalog_categories
  for select
  to authenticated
  using (true);

-- Service role / admin writes via service key (no broad write policy for anon).

insert into public.catalog_categories (kind, value, label, label_am, sort_order) values
  ('product', 'metal_detectors', 'Metal Detectors', 'የብረት መፈለጊያዎች', 1),
  ('product', 'ground_scanners', 'Ground Scanners', 'የመሬት ስካነሮች', 2),
  ('product', 'drilling', 'Drilling', 'ቁፋሮ', 3),
  ('product', 'excavators', 'Excavators', 'ቆፋሪዎች', 4),
  ('product', 'mining_supplies', 'Mining Supplies', 'የማዕድን አቅርቦቶች', 5),
  ('service', 'training', 'Training', 'ስልጠና', 1),
  ('service', 'field_support', 'Field Support', 'የመስክ ድጋፍ', 2),
  ('service', 'on_site_assembly', 'On-Site Assembly', 'በቦታው ላይ ስብሰባ', 3),
  ('service', 'financing', 'Financing', 'ፋይናንስ', 4)
on conflict (kind, value) do update set
  label = excluded.label,
  label_am = excluded.label_am,
  sort_order = excluded.sort_order,
  is_active = true;

-- Relax hard-coded CHECK constraints so categories can grow from the table.
alter table public.products drop constraint if exists products_category_check;
alter table public.services drop constraint if exists services_category_check;
