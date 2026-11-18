-- Independent DKC Race Control data. Existing 2026 tables remain unchanged.
create table public.dkc_members(email text primary key, role text not null check(role in ('admin','technical')));
create table public.dkc_events(id uuid primary key default gen_random_uuid(), title text not null, date date not null, season text not null, location text not null, open boolean not null default false);
create table public.dkc_drivers(id uuid primary key default gen_random_uuid(), first text not null, last text not null, email text not null, phone text not null, team text not null default '', klasse text not null, number text not null, transponder text not null default '', kind text not null check(kind in ('season','guest')), season text not null, event_id uuid references public.dkc_events(id), consent_at timestamptz not null default now(), created_at timestamptz not null default now(), check((kind='guest' and event_id is not null) or (kind='season' and event_id is null)));
create unique index dkc_driver_season_unique on public.dkc_drivers(lower(email),lower(first),lower(last),klasse,season) where kind='season';
create unique index dkc_driver_guest_unique on public.dkc_drivers(lower(email),lower(first),lower(last),klasse,event_id) where kind='guest';
create table public.dkc_entries(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.dkc_events(id),driver_id uuid not null references public.dkc_drivers(id),number text not null check(number ~ '^[0-9]{1,4}$'),transponder text not null default '',status text not null default 'offen' check(status in ('offen','nachkontrolle','bestanden')),checks text not null default '[]',notes text not null default '',inspector text,checked_at timestamptz,version integer not null default 1,unique(event_id,driver_id),unique(event_id,number));
create unique index dkc_transponder_unique on public.dkc_entries(event_id,transponder) where transponder<>'';
create table public.dkc_offers(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.dkc_events(id),name text not null,price_cents integer not null check(price_cents>0),open boolean not null default false,deadline date,note text not null default '');
create table public.dkc_orders(id uuid primary key default gen_random_uuid(),request_id uuid not null unique,offer_id uuid not null references public.dkc_offers(id),event_id uuid not null references public.dkc_events(id),first text not null,last text not null,email text not null,phone text not null,team text not null default '',klasse text not null,number text not null,product text not null,price_cents integer not null check(price_cents>0),quantity integer not null check(quantity between 1 and 50),paid boolean not null default false,cancelled boolean not null default false,version integer not null default 1,created_at timestamptz not null default now());
create table public.dkc_documents(id uuid primary key default gen_random_uuid(),event_id uuid references public.dkc_events(id),season text not null,title text not null,category text not null,file_path text not null,size integer not null,published boolean not null default false,created_at timestamptz not null default now());
create table public.dkc_audit(id uuid primary key default gen_random_uuid(),actor text not null,action text not null,at timestamptz not null default now());
create table public.dkc_rate_limits(key text primary key,hits integer not null default 1,window_start timestamptz not null default now());
create function public.dkc_rate_check(p_key text) returns boolean language sql security invoker set search_path='' as $$
 insert into public.dkc_rate_limits as r(key) values(p_key)
 on conflict(key) do update set hits=case when r.window_start<now()-interval '10 minutes' then 1 else r.hits+1 end,window_start=case when r.window_start<now()-interval '10 minutes' then now() else r.window_start end returning hits<=30;
$$;
revoke all on function public.dkc_rate_check(text) from public,anon,authenticated;
grant execute on function public.dkc_rate_check(text) to service_role;
do $$ declare t text; begin foreach t in array array['members','events','drivers','entries','offers','orders','documents','audit','rate_limits'] loop
 execute format('alter table public.dkc_%I enable row level security',t);
 execute format('revoke all on table public.dkc_%I from anon,authenticated',t);
 execute format('grant all on table public.dkc_%I to service_role',t);
 end loop;end $$;
insert into public.dkc_members(email,role) select lower(email),'admin' from auth.users where lower(email)='andy_zenner@web.de' and email_confirmed_at is not null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('dkc-control-documents','dkc-control-documents',false,15728640,array['application/pdf']);
insert into public.dkc_events(title,date,season,location,open) values('TEST – DKC Funktionsprüfung','2027-01-01','2027','Testveranstaltung – kein echter Renntermin',true);
insert into public.dkc_offers(event_id,name,price_cents,open,note) select id,'TEST – Mojo D5',23000,true,'Nur Funktionstest. Keine verbindliche Lieferung.' from public.dkc_events where title='TEST – DKC Funktionsprüfung';
