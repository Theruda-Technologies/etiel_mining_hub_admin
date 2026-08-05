-- Apply if 001_init was already run with operator role.
-- Safe to run in SQL Editor.

do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'operator'
  ) then
    update public.profiles set role = 'admin' where role::text = 'operator';
    alter type public.app_role rename to app_role_old;
    create type public.app_role as enum ('super_admin', 'admin');
    alter table public.profiles
      alter column role type public.app_role
      using role::text::public.app_role;
    drop type public.app_role_old;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'suspended', 'invited'));
