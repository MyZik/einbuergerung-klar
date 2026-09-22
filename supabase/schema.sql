create schema if not exists private;
create table private.admin_emails (email text primary key);
revoke all on private.admin_emails from public, anon, authenticated;
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (select 1 from auth.users u join private.admin_emails a on lower(u.email)=a.email where u.id=auth.uid() and u.email_confirmed_at is not null)
$$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
create function public.is_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select private.is_admin() $$;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;
create table public.questions (
 id text primary key, number integer not null check(number>0), state text,
 question text not null check(length(trim(question))>0),
 answers text[] not null check(array_length(answers,1)=4),
 correct_answer integer not null check(correct_answer between 0 and 3),
 image_url text, source_page integer, explanation text not null default '',
 active boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.questions enable row level security;
grant select on public.questions to anon, authenticated;
grant insert,update,delete on public.questions to authenticated;
create policy read_published on public.questions for select to anon,authenticated using(active);
create policy admin_read on public.questions for select to authenticated using((select private.is_admin()));
create policy admin_insert on public.questions for insert to authenticated with check((select private.is_admin()));
create policy admin_update on public.questions for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_delete on public.questions for delete to authenticated using((select private.is_admin()));
