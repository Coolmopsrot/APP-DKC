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
  status text default 'Bestätigt',
  created_at timestamptz not null default now()
);

create unique index if not exists registrations_unique_race_kartnumber
on public.registrations (race, lower(kart_number));

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  race text default 'Alle Rennen',
  file_name text not null,
  file_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;
alter table public.documents enable row level security;

drop policy if exists "allow read registrations" on public.registrations;
drop policy if exists "allow insert registrations" on public.registrations;
drop policy if exists "allow update registrations" on public.registrations;
drop policy if exists "allow delete registrations" on public.registrations;
drop policy if exists "allow read documents" on public.documents;
drop policy if exists "allow insert documents" on public.documents;
drop policy if exists "allow delete documents" on public.documents;

create policy "allow read registrations" on public.registrations for select to anon, authenticated using (true);
create policy "allow insert registrations" on public.registrations for insert to anon, authenticated with check (true);
create policy "allow update registrations" on public.registrations for update to anon, authenticated using (true) with check (true);
create policy "allow delete registrations" on public.registrations for delete to anon, authenticated using (true);

create policy "allow read documents" on public.documents for select to anon, authenticated using (true);
create policy "allow insert documents" on public.documents for insert to anon, authenticated with check (true);
create policy "allow delete documents" on public.documents for delete to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "Public read documents storage" on storage.objects;
drop policy if exists "Auth upload documents storage" on storage.objects;
drop policy if exists "Auth delete documents storage" on storage.objects;

create policy "Public read documents storage" on storage.objects for select to public using (bucket_id = 'documents');
create policy "Auth upload documents storage" on storage.objects for insert to anon, authenticated with check (bucket_id = 'documents');
create policy "Auth delete documents storage" on storage.objects for delete to anon, authenticated using (bucket_id = 'documents');
