-- Automatic publication rules for the Mirsad ingestion bot.

alter table public.learning_sources
  add column if not exists parser_key text not null default 'auto',
  add column if not exists last_sync_status text,
  add column if not exists last_sync_message text;

alter table public.learning_opportunities
  add column if not exists registration_ends_at timestamptz,
  add column if not exists source_fingerprint text,
  add column if not exists last_seen_at timestamptz;

update public.learning_opportunities
set source_fingerprint = lower(trim(source_url)) || '#' || lower(trim(title_ar))
where source_fingerprint is null;

create unique index if not exists learning_opportunities_source_fingerprint_idx
  on public.learning_opportunities (source_fingerprint)
  where source_fingerprint is not null;

create index if not exists learning_opportunities_registration_deadline_idx
  on public.learning_opportunities (registration_ends_at)
  where is_published = true;

create or replace function private.enforce_learning_opportunity_deadline()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.registration_ends_at is not null and new.registration_ends_at <= now())
    or (new.registration_ends_at is null and new.ends_at is not null and new.ends_at <= now()) then
    new.status := 'closed';
    new.is_published := false;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_learning_opportunity_deadline on public.learning_opportunities;
create trigger enforce_learning_opportunity_deadline
before insert or update on public.learning_opportunities
for each row execute function private.enforce_learning_opportunity_deadline();

create or replace function public.archive_expired_learning_opportunities()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected bigint;
begin
  update public.learning_opportunities
  set status = 'closed', is_published = false
  where is_published = true
    and (
      (registration_ends_at is not null and registration_ends_at <= now())
      or (registration_ends_at is null and ends_at is not null and ends_at <= now())
    );
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.archive_expired_learning_opportunities() from public, anon, authenticated;

comment on column public.learning_opportunities.registration_ends_at is
  'The official registration deadline. The trigger hides the opportunity after this instant.';

insert into public.learning_sources (name, website_url, feed_url, parser_key, is_active)
values
  ('مجلس الكويت للمباني الخضراء — KGBC', 'https://www.kuwaitgbc.com/', 'https://www.kuwaitgbc.com/events', 'auto', true),
  ('مؤسسة الكويت للتقدم العلمي — KFAS', 'https://www.kfas.org.kw/', 'https://apply.kfas.org.kw/FormDetails/SubServices?Id=54043757-b3f6-f011-8406-70a8a51d5041', 'auto', true),
  ('معهد الكويت للأبحاث العلمية — KISR', 'https://www.kisr.edu.kw/', 'https://www.kisr.edu.kw/ar/careers-training/training-courses/', 'auto', true),
  ('مركز صباح الأحمد للموهبة والإبداع — SACGC', 'https://sacgc.org/', 'https://sacgc.org/en/', 'auto', true)
on conflict (website_url) do update set
  name = excluded.name,
  feed_url = excluded.feed_url,
  parser_key = excluded.parser_key,
  is_active = true;
