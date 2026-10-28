-- NovaCart admin-role setup.
-- This adds a separate role table so customers cannot promote themselves.
-- Safe to run after the profiles table migration already used for NovaCart.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer'
    check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- The browser client can read roles, but it cannot create/change/delete them.
revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists "Users can read own NovaCart role"
on public.user_roles;

create policy "Users can read own NovaCart role"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Assign the customer role automatically to new Auth accounts.
create or replace function public.novacart_assign_default_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.novacart_assign_default_role() from public, anon, authenticated;

drop trigger if exists novacart_user_role_on_signup on auth.users;

create trigger novacart_user_role_on_signup
after insert on auth.users
for each row execute function public.novacart_assign_default_role();

-- Add default roles for existing accounts without changing anyone's current role.
insert into public.user_roles (user_id, role)
select id, 'customer'
from auth.users
on conflict (user_id) do nothing;

-- IMPORTANT: This script deliberately does NOT make any account an admin.
-- To grant admin to your own account, find your user UUID under
-- Supabase Dashboard > Authentication > Users, then run a separate query:
-- update public.user_roles set role = 'admin' where user_id = 'YOUR-USER-UUID';
