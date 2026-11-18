alter table public.dkc_members add column if not exists username text unique check (username = lower(username));
create or replace function public.dkc_confirmed_user_exists(p_email text) returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from auth.users where lower(email)=lower(p_email) and email_confirmed_at is not null);
$$;
revoke all on function public.dkc_confirmed_user_exists(text) from public,anon,authenticated;
grant execute on function public.dkc_confirmed_user_exists(text) to service_role;