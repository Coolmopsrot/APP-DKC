alter table public.dkc_drivers add column public_listing boolean not null default false;
create index dkc_public_enrollments on public.dkc_drivers (season, klasse, last, first, id)
where kind = 'season' and public_listing;
