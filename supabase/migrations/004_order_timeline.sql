-- Order timeline for order detail page (run in Supabase SQL Editor)

create table if not exists public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  title text not null,
  event_date timestamptz not null default now(),
  description text not null default '',
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_timeline_order_id_idx
  on public.order_timeline (order_id, sort_order);

alter table public.order_timeline enable row level security;

drop policy if exists "order_timeline_select_authenticated" on public.order_timeline;
create policy "order_timeline_select_authenticated" on public.order_timeline
  for select to authenticated using (true);

drop policy if exists "order_timeline_write_authenticated" on public.order_timeline;
create policy "order_timeline_write_authenticated" on public.order_timeline
  for all to authenticated using (true) with check (true);

-- Allow service role / authenticated inserts via policies above
grant select, insert, update, delete on public.order_timeline to authenticated;
grant all on public.order_timeline to service_role;
