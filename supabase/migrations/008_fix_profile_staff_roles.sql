-- Fix profile role guard so service_role (admin API / scripts) can set roles.
-- Live DB defaulted profiles.role to 'customer' and blocked role UPDATEs.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow PostgREST service_role (invite scripts, ensure-super-admin, admin APIs).
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.role is distinct from new.role then
    if not exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'admin')
        and p.role = 'super_admin'
    ) and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'super_admin' then
      raise exception 'Only super_admin can change roles';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_role_escalation on public.profiles;
drop trigger if exists trg_prevent_role_escalation on public.profiles;
drop trigger if exists profiles_prevent_role_change on public.profiles;

-- Recreate under a stable name (works whether the old trigger existed or not).
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_role_escalation();

-- Prefer Auth app_metadata.role when creating profiles (admin / super_admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text;
begin
  selected_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'role', ''),
    'customer'
  );

  -- Staff invites always carry admin/super_admin in app_metadata.
  if selected_role not in ('super_admin', 'admin', 'customer') then
    selected_role := 'customer';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    selected_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = case
          when excluded.role in ('super_admin', 'admin') then excluded.role
          else public.profiles.role
        end,
        updated_at = now();

  return new;
end;
$$;
