-- Optional columns for profiles (run in Supabase SQL Editor)
alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists status text not null default 'active';

alter table public.profiles
  add column if not exists invited_by uuid references public.profiles (id) on delete set null;

-- Sync invite/active status from auth metadata when present
update public.profiles p
set
  avatar_url = coalesce(p.avatar_url, au.raw_user_meta_data->>'avatar_url'),
  status = coalesce(nullif(au.raw_user_meta_data->>'status', ''), p.status)
from auth.users au
where au.id = p.id;
