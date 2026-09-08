-- Initial catalog only. Refuses to touch an existing catalog; no demo records.
begin;
create schema if not exists private;
do $$ begin
  if to_regclass('public.learning_sources') is not null or to_regclass('public.learning_opportunities') is not null or to_regclass('public.learning_source_documents') is not null then
    raise exception 'Catalog already exists: use incremental migrations instead';
  end if;
end $$;
create table public.learning_sources (
 id uuid primary key default gen_random_uuid(), name text not null, website_url text not null unique, feed_url text,
 is_active boolean not null default true, last_synced_at timestamptz, last_sync_status text, last_sync_message text,
 parser_key text not null default 'auto', channel_status jsonb not null default '[]',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.learning_opportunities (
 id text primary key check (char_length(id) between 3 and 120), source_id uuid references public.learning_sources(id),
 title_ar text not null check (char_length(title_ar) between 3 and 240), title_en text, description_ar text not null check (char_length(description_ar) <= 1800),
 kind text not null check (kind in ('course','workshop','camp')), category text not null, subcategory text not null, organizer text not null,
 location text not null, governorate text not null default 'غير محدد', mode text not null check (mode in ('in_person','online','hybrid')),
 min_age smallint check (min_age between 3 and 99), max_age smallint check (max_age between 3 and 99), age_label text not null default 'غير معلن من الجهة',
 duration_label text not null, schedule_label text not null, starts_at timestamptz, ends_at timestamptz, registration_ends_at timestamptz,
 price_kwd numeric(10,3) check (price_kwd >= 0), status text not null default 'verify' check (status in ('open','verify','closed')),
 registration_url text not null, source_url text not null, image_url text not null, image_caption text,
 tags text[] not null default '{}', featured boolean not null default false, is_published boolean not null default false,
 source_checked_at date not null default current_date, last_seen_at timestamptz, source_fingerprint text unique,
 content_hash text, ai_review_status text not null default 'pending' check (ai_review_status in ('pending','verified','needs_review','unavailable')),
 ai_reviewed_at timestamptz, ai_review_note text, ai_review_model text,
 publication_ready boolean not null default false, publication_issues text[] not null default '{}', review_policy_version text,
 evidence_hash text, registration_page_hash text, field_evidence jsonb not null default '[]' check (jsonb_typeof(field_evidence)='array'),
 registration_state text not null default 'unknown' check (registration_state in ('open','closed','unknown')),
 announcement_channel text not null default 'website' check (announcement_channel in ('website','youtube','x','instagram')),
 official_account_url text, official_account_proof_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (max_age is null or min_age is null or max_age >= min_age)
);
create table public.learning_source_documents (
 source_id uuid not null references public.learning_sources(id), document_url text not null, channel text not null,
 evidence_hash text not null, evidence jsonb not null, rows jsonb not null default '[]', status text not null,
 review_policy_version text not null, reviewed_at timestamptz not null, checked_at timestamptz not null,
 primary key(source_id,document_url)
);
alter table public.learning_sources enable row level security;
alter table public.learning_opportunities enable row level security;
alter table public.learning_source_documents enable row level security;
revoke all on public.learning_sources,public.learning_opportunities,public.learning_source_documents from anon,authenticated;
grant select on public.learning_sources,public.learning_opportunities to anon,authenticated;
grant all on public.learning_sources,public.learning_opportunities,public.learning_source_documents to service_role;
create policy learning_sources_public_read on public.learning_sources for select to anon,authenticated using(is_active);
create policy learning_opportunities_public_read on public.learning_opportunities for select to anon,authenticated
 using(is_published and publication_ready and ai_review_status='verified' and status='open' and registration_state='open'
 and starts_at>now() and registration_ends_at>now() and last_seen_at>now()-interval '24 hours');
create index learning_opportunities_discovery_idx on public.learning_opportunities(is_published,featured desc,category,status);
create index learning_opportunities_registration_deadline_idx on public.learning_opportunities(registration_ends_at);
create function private.enforce_complete_learning_announcement()
returns trigger language plpgsql set search_path = '' as $$
declare official_host text; registration_host text; all_evidence boolean; age_evidence boolean; price_evidence boolean;
begin
  if new.min_age is null and new.max_age is null then new.age_label := 'غير معلن من الجهة'; end if;
  select regexp_replace(lower(substring(website_url from '^https://([^/?#]+)')), '^www\.', '')
    into official_host from public.learning_sources where id = new.source_id and is_active;
  registration_host := lower(substring(new.registration_url from '^https://([^/?#]+)'));
  select count(distinct claim->>'field') = 7 into all_evidence
    from jsonb_array_elements(case when jsonb_typeof(new.field_evidence) = 'array' then new.field_evidence else '[]'::jsonb end) claim
    where claim->>'field' in ('title','description','kind','schedule','location','mode','registration') and length(trim(claim->>'quote')) > 0;
  select exists(select 1 from jsonb_array_elements(new.field_evidence) claim where claim->>'field' = 'age' and length(trim(claim->>'quote')) > 0) into age_evidence;
  select exists(select 1 from jsonb_array_elements(new.field_evidence) claim where claim->>'field' = 'price' and length(trim(claim->>'quote')) > 0) into price_evidence;
  new.publication_ready := coalesce(
    new.ai_review_status = 'verified' and new.ai_reviewed_at is not null
    and new.review_policy_version = 'official-nullable-age-fees-v3'
    and length(new.evidence_hash) = 64 and length(new.registration_page_hash) = 64 and all_evidence
    and new.registration_state = 'open'
    and new.starts_at > now() and new.ends_at >= new.starts_at
    and new.registration_ends_at > now() and new.registration_ends_at <= new.starts_at
    and ((new.min_age is null and new.max_age is null) or (age_evidence and length(trim(new.age_label)) > 0
      and new.age_label !~* '(لم يحدد|غير محدد|غير معلن|يحدده|غير منشور|unknown|unspecified|tba|tbd)'))
    and (new.min_age is null or new.max_age is null or new.max_age >= new.min_age)
    and (new.price_kwd is null or (new.price_kwd >= 0 and price_evidence))
    and new.last_seen_at > now() - interval '24 hours'
    and length(trim(new.title_ar)) >= 3 and length(trim(new.description_ar)) >= 10
    and length(trim(new.location)) > 0 and length(trim(new.duration_label)) > 0
    and length(trim(new.schedule_label)) > 0 and length(trim(new.category)) > 0 and length(trim(new.subcategory)) > 0
    and length(new.image_url) > 0 and new.image_url ~ '^https://'
    and (new.location || new.duration_label || new.schedule_label) !~* '(لم يحدد|غير محدد|غير معلن|يحدده|غير منشور|unknown|unspecified|tba|tbd)'
    and (registration_host = official_host or right(registration_host, length(official_host) + 1) = '.' || official_host)
    and (new.announcement_channel = 'website' or (new.official_account_url is not null and new.official_account_proof_url is not null))
    and cardinality(new.publication_issues) = 0, false);
  if not new.publication_ready then new.is_published := false; end if;
  if new.starts_at <= now() or new.registration_ends_at <= now() then new.status := 'closed'; new.is_published := false; end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger zz_enforce_complete_learning_announcement before insert or update on public.learning_opportunities
for each row execute function private.enforce_complete_learning_announcement();
create function public.archive_expired_learning_opportunities()
returns bigint language plpgsql security definer set search_path = '' as $$
declare affected bigint;
begin
  update public.learning_opportunities set is_published = false, publication_ready = false,
    status = case when registration_ends_at <= now() or starts_at <= now() then 'closed' else 'verify' end
  where is_published and (registration_ends_at is null or registration_ends_at <= now()
    or starts_at is null or starts_at <= now() or last_seen_at is null or last_seen_at <= now() - interval '24 hours');
  get diagnostics affected = row_count;
  return affected;
end;
$$;
revoke all on function public.archive_expired_learning_opportunities() from public, anon, authenticated;
grant execute on function public.archive_expired_learning_opportunities() to service_role;
notify pgrst,'reload schema';
commit;
