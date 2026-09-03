-- CivilKuwait production schema for GitHub Pages + Supabase.
-- Run this file once in the Supabase SQL Editor for project crqjtgolagrknjkpbsdi.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text check (char_length(display_name) <= 80),
  job_title text check (char_length(job_title) <= 120),
  company text check (char_length(company) <= 160),
  phone text check (char_length(phone) <= 40),
  governorate text check (char_length(governorate) <= 80),
  bio text check (char_length(bio) <= 500),
  role text not null default 'homeowner' check (role in ('homeowner','engineer','contractor','supplier','admin')),
  locale text not null default 'ar' check (locale in ('ar','en')),
  theme text not null default 'system' check (theme in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_single_admin_idx on public.profiles (role) where role = 'admin';

create table if not exists private.platform_settings (
  singleton boolean primary key default true check (singleton),
  admin_user_id uuid unique references auth.users(id) on delete set null,
  admin_setup_code_sha256 text not null,
  updated_at timestamptz not null default now()
);

insert into private.platform_settings (singleton, admin_setup_code_sha256)
values (true, '711c0e4490c799da4483365ac4903f95f61f35b407d083c84b04c0662eb73616')
on conflict (singleton) do update set admin_setup_code_sha256 = excluded.admin_setup_code_sha256
where private.platform_settings.admin_user_id is null;

create table if not exists public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  project_type text not null default 'house',
  governorate text,
  status text not null default 'planning' check (status in ('planning','design','tender','construction','completed','archived')),
  budget_kwd numeric(14,3) check (budget_kwd is null or budget_kwd >= 0),
  spent_kwd numeric(14,3) not null default 0 check (spent_kwd >= 0),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);

create table if not exists public.boq_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null default 'BOQ' check (char_length(title) <= 180),
  currency text not null default 'KWD' check (currency = 'KWD'),
  total numeric(16,3) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boq_documents_user_id_idx on public.boq_documents(user_id);
create index if not exists boq_documents_project_id_idx on public.boq_documents(project_id);

create table if not exists public.boq_items (
  id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references public.boq_documents(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  description text not null default '' check (char_length(description) <= 500),
  quantity numeric(16,4) not null default 0 check (quantity >= 0),
  unit text not null default 'unit' check (char_length(unit) <= 24),
  rate numeric(16,4) not null default 0 check (rate >= 0),
  specification text check (char_length(specification) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists boq_items_document_id_idx on public.boq_items(document_id);

create table if not exists public.inspection_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  checklist_key text not null check (char_length(checklist_key) <= 100),
  title text not null check (char_length(title) <= 180),
  notes text check (char_length(notes) <= 4000),
  status text not null default 'in_progress' check (status in ('in_progress','completed','requires_action')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inspection_runs_user_id_idx on public.inspection_runs(user_id);
create index if not exists inspection_runs_project_id_idx on public.inspection_runs(project_id);

create table if not exists public.inspection_items (
  id uuid primary key default extensions.gen_random_uuid(),
  run_id uuid not null references public.inspection_runs(id) on delete cascade,
  item_key text not null,
  label text not null check (char_length(label) <= 500),
  result text not null default 'pending' check (result in ('pending','pass','fail')),
  note text check (char_length(note) <= 1000),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, item_key)
);
create index if not exists inspection_items_run_id_idx on public.inspection_items(run_id);

create table if not exists public.ai_conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discipline text not null default 'Construction AI' check (char_length(discipline) <= 80),
  transcript jsonb not null default '[]'::jsonb,
  model text not null default 'safe-local-source-router' check (char_length(model) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_conversations_user_id_idx on public.ai_conversations(user_id);

create table if not exists public.project_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  storage_path text not null,
  file_name text not null check (char_length(file_name) <= 240),
  mime_type text not null check (mime_type in ('application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);
create index if not exists project_documents_user_id_idx on public.project_documents(user_id);
create index if not exists project_documents_project_id_idx on public.project_documents(project_id);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','projects','boq_documents','boq_items','inspection_runs','inspection_items','ai_conversations']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.touch_updated_at()', table_name);
  end loop;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_platform_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.claim_platform_admin(setup_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  claimed_id uuid;
begin
  if caller_id is null or setup_code is null then return false; end if;

  update private.platform_settings
  set admin_user_id = caller_id, updated_at = now()
  where singleton = true
    and admin_user_id is null
    and admin_setup_code_sha256 = encode(extensions.digest(setup_code, 'sha256'), 'hex')
  returning admin_user_id into claimed_id;

  if claimed_id is null then return false; end if;
  update public.profiles set role = 'admin' where id = caller_id;
  return true;
exception when unique_violation then
  return false;
end;
$$;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_platform_admin() to authenticated;
revoke all on function public.claim_platform_admin(text) from public, anon;
grant execute on function public.claim_platform_admin(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.boq_documents enable row level security;
alter table public.boq_items enable row level security;
alter table public.inspection_runs enable row level security;
alter table public.inspection_items enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.project_documents enable row level security;

revoke all on table public.profiles, public.projects, public.boq_documents, public.boq_items, public.inspection_runs, public.inspection_items, public.ai_conversations, public.project_documents from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, job_title, company, phone, governorate, bio, locale, theme) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.projects, public.boq_documents, public.boq_items, public.inspection_runs, public.inspection_items, public.ai_conversations, public.project_documents to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles for select to authenticated using ((select private.is_platform_admin()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists projects_select_own_or_admin on public.projects;
create policy projects_select_own_or_admin on public.projects for select to authenticated using ((select auth.uid()) = user_id or (select private.is_platform_admin()));
drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists boq_documents_select_own_or_admin on public.boq_documents;
create policy boq_documents_select_own_or_admin on public.boq_documents for select to authenticated using ((select auth.uid()) = user_id or (select private.is_platform_admin()));
drop policy if exists boq_documents_insert_own on public.boq_documents;
create policy boq_documents_insert_own on public.boq_documents for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists boq_documents_update_own on public.boq_documents;
create policy boq_documents_update_own on public.boq_documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists boq_documents_delete_own on public.boq_documents;
create policy boq_documents_delete_own on public.boq_documents for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists boq_items_select_own_or_admin on public.boq_items;
create policy boq_items_select_own_or_admin on public.boq_items for select to authenticated using (exists (select 1 from public.boq_documents d where d.id = document_id and (d.user_id = (select auth.uid()) or (select private.is_platform_admin()))));
drop policy if exists boq_items_insert_own on public.boq_items;
create policy boq_items_insert_own on public.boq_items for insert to authenticated with check (exists (select 1 from public.boq_documents d where d.id = document_id and d.user_id = (select auth.uid())));
drop policy if exists boq_items_update_own on public.boq_items;
create policy boq_items_update_own on public.boq_items for update to authenticated using (exists (select 1 from public.boq_documents d where d.id = document_id and d.user_id = (select auth.uid()))) with check (exists (select 1 from public.boq_documents d where d.id = document_id and d.user_id = (select auth.uid())));
drop policy if exists boq_items_delete_own on public.boq_items;
create policy boq_items_delete_own on public.boq_items for delete to authenticated using (exists (select 1 from public.boq_documents d where d.id = document_id and d.user_id = (select auth.uid())));

drop policy if exists inspection_runs_select_own_or_admin on public.inspection_runs;
create policy inspection_runs_select_own_or_admin on public.inspection_runs for select to authenticated using ((select auth.uid()) = user_id or (select private.is_platform_admin()));
drop policy if exists inspection_runs_insert_own on public.inspection_runs;
create policy inspection_runs_insert_own on public.inspection_runs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists inspection_runs_update_own on public.inspection_runs;
create policy inspection_runs_update_own on public.inspection_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists inspection_runs_delete_own on public.inspection_runs;
create policy inspection_runs_delete_own on public.inspection_runs for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists inspection_items_select_own_or_admin on public.inspection_items;
create policy inspection_items_select_own_or_admin on public.inspection_items for select to authenticated using (exists (select 1 from public.inspection_runs r where r.id = run_id and (r.user_id = (select auth.uid()) or (select private.is_platform_admin()))));
drop policy if exists inspection_items_insert_own on public.inspection_items;
create policy inspection_items_insert_own on public.inspection_items for insert to authenticated with check (exists (select 1 from public.inspection_runs r where r.id = run_id and r.user_id = (select auth.uid())));
drop policy if exists inspection_items_update_own on public.inspection_items;
create policy inspection_items_update_own on public.inspection_items for update to authenticated using (exists (select 1 from public.inspection_runs r where r.id = run_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.inspection_runs r where r.id = run_id and r.user_id = (select auth.uid())));
drop policy if exists inspection_items_delete_own on public.inspection_items;
create policy inspection_items_delete_own on public.inspection_items for delete to authenticated using (exists (select 1 from public.inspection_runs r where r.id = run_id and r.user_id = (select auth.uid())));

drop policy if exists ai_conversations_select_own_or_admin on public.ai_conversations;
create policy ai_conversations_select_own_or_admin on public.ai_conversations for select to authenticated using ((select auth.uid()) = user_id or (select private.is_platform_admin()));
drop policy if exists ai_conversations_insert_own on public.ai_conversations;
create policy ai_conversations_insert_own on public.ai_conversations for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists ai_conversations_update_own on public.ai_conversations;
create policy ai_conversations_update_own on public.ai_conversations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists ai_conversations_delete_own on public.ai_conversations;
create policy ai_conversations_delete_own on public.ai_conversations for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists project_documents_select_own_or_admin on public.project_documents;
create policy project_documents_select_own_or_admin on public.project_documents for select to authenticated using ((select auth.uid()) = user_id or (select private.is_platform_admin()));
drop policy if exists project_documents_insert_own on public.project_documents;
create policy project_documents_insert_own on public.project_documents for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists project_documents_delete_own on public.project_documents;
create policy project_documents_delete_own on public.project_documents for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('civilkuwait-private', 'civilkuwait-private', false, 10485760, array['application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists civilkuwait_storage_select_own on storage.objects;
create policy civilkuwait_storage_select_own on storage.objects for select to authenticated using (bucket_id = 'civilkuwait-private' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_platform_admin())));
drop policy if exists civilkuwait_storage_insert_own on storage.objects;
create policy civilkuwait_storage_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'civilkuwait-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists civilkuwait_storage_update_own on storage.objects;
create policy civilkuwait_storage_update_own on storage.objects for update to authenticated using (bucket_id = 'civilkuwait-private' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'civilkuwait-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists civilkuwait_storage_delete_own on storage.objects;
create policy civilkuwait_storage_delete_own on storage.objects for delete to authenticated using (bucket_id = 'civilkuwait-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
