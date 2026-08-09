-- Exclusive advertisement: at most one product OR one service.
alter table public.products
  add column if not exists is_advertisement boolean not null default false;

alter table public.services
  add column if not exists is_advertisement boolean not null default false;

create index if not exists products_is_advertisement_idx
  on public.products (is_advertisement)
  where is_advertisement = true;

create index if not exists services_is_advertisement_idx
  on public.services (is_advertisement)
  where is_advertisement = true;

create or replace function public.clear_other_advertisements()
returns trigger
language plpgsql
as $$
begin
  if new.is_advertisement is true then
    update public.products
      set is_advertisement = false, updated_at = now()
      where is_advertisement = true
        and id is distinct from new.id;

    update public.services
      set is_advertisement = false, updated_at = now()
      where is_advertisement = true
        and id is distinct from new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists products_exclusive_advertisement on public.products;
create trigger products_exclusive_advertisement
  before insert or update of is_advertisement on public.products
  for each row
  when (new.is_advertisement = true)
  execute function public.clear_other_advertisements();

drop trigger if exists services_exclusive_advertisement on public.services;
create trigger services_exclusive_advertisement
  before insert or update of is_advertisement on public.services
  for each row
  when (new.is_advertisement = true)
  execute function public.clear_other_advertisements();
