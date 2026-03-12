create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  race text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  kart_number text not null,
  team_name text not null,
  kart_class text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists registrations_unique_race_kartnumber
on public.registrations (race, lower(kart_number));

alter table public.registrations enable row level security;

create policy "public can insert registrations"
on public.registrations
for insert
to anon, authenticated
with check (true);

create policy "authenticated can read registrations"
on public.registrations
for select
to authenticated
using (true);
