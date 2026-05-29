create table if not exists public.trails (
  id text primary key,
  payload jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  email text primary key,
  role text not null check (role in ('admin', 'trails_adder', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_trails_updated_at on public.trails;
create trigger set_trails_updated_at
before update on public.trails
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_updated_at();

alter table public.trails enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "Anyone can read trails" on public.trails;
create policy "Anyone can read trails"
on public.trails
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can save trails" on public.trails;
create policy "Authenticated users can save trails"
on public.trails
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update trails" on public.trails;
create policy "Authenticated users can update trails"
on public.trails
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can read roles" on public.user_roles;
create policy "Authenticated users can read roles"
on public.user_roles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can save roles" on public.user_roles;
create policy "Authenticated users can save roles"
on public.user_roles
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update roles" on public.user_roles;
create policy "Authenticated users can update roles"
on public.user_roles
for update
to authenticated
using (true)
with check (true);
