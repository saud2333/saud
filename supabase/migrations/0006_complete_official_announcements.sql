-- Only complete, source-supported, currently open announcements may be public.
begin;

alter table public.learning_sources add column if not exists channel_status jsonb not null default '[]';
alter table public.learning_opportunities
  add column if not exists publication_ready boolean not null default false,
  add column if not exists publication_issues text[] not null default '{}',
  add column if not exists review_policy_version text,
  add column if not exists evidence_hash text,
  add column if not exists registration_page_hash text,
  add column if not exists field_evidence jsonb not null default '[]',
  add column if not exists registration_state text not null default 'unknown' check (registration_state in ('open', 'closed', 'unknown')),
  add column if not exists announcement_channel text not null default 'website' check (announcement_channel in ('website', 'youtube', 'x', 'instagram')),
  add column if not exists official_account_url text,
  add column if not exists official_account_proof_url text;

-- A full unique index supports PostgREST ON CONFLICT inference, including nulls.
drop index if exists public.learning_opportunities_source_fingerprint_idx;
create unique index learning_opportunities_source_fingerprint_idx on public.learning_opportunities(source_fingerprint);

create table if not exists public.learning_source_documents (
  source_id uuid not null references public.learning_sources(id) on delete cascade,
  document_url text not null,
  channel text not null,
  evidence_hash text not null,
  evidence jsonb not null,
  rows jsonb not null default '[]',
  status text not null,
  review_policy_version text not null,
  reviewed_at timestamptz not null,
  checked_at timestamptz not null,
  primary key(source_id, document_url)
);
alter table public.learning_source_documents enable row level security;
revoke all on public.learning_source_documents from anon, authenticated;
grant all on public.learning_source_documents, public.learning_opportunities, public.learning_sources to service_role;
grant execute on function public.archive_expired_learning_opportunities() to service_role;

create or replace function private.enforce_complete_learning_announcement()
returns trigger language plpgsql set search_path = '' as $$
declare official_host text; registration_host text; all_evidence boolean;
begin
  select regexp_replace(lower(substring(website_url from '^https://([^/?#]+)')), '^www\.', '')
    into official_host from public.learning_sources where id = new.source_id and is_active;
  registration_host := lower(substring(new.registration_url from '^https://([^/?#]+)'));
  select count(distinct claim->>'field') = 9 into all_evidence
    from jsonb_array_elements(case when jsonb_typeof(new.field_evidence) = 'array' then new.field_evidence else '[]'::jsonb end) claim
    where claim->>'field' in ('title','description','kind','age','schedule','location','mode','price','registration')
      and length(trim(claim->>'quote')) > 0;
  new.publication_ready := coalesce(
    new.ai_review_status = 'verified' and new.ai_reviewed_at is not null
    and new.review_policy_version = 'complete-official-v2'
    and length(new.evidence_hash) = 64 and length(new.registration_page_hash) = 64 and all_evidence
    and new.registration_state = 'open'
    and new.starts_at > now() and new.ends_at >= new.starts_at
    and new.registration_ends_at > now() and new.registration_ends_at <= new.starts_at
    and new.min_age is not null and new.max_age >= new.min_age
    and new.price_kwd is not null and new.price_kwd >= 0
    and new.last_seen_at > now() - interval '24 hours'
    and length(trim(new.title_ar)) >= 3 and length(trim(new.description_ar)) >= 10
    and length(trim(new.location)) > 0 and length(trim(new.duration_label)) > 0
    and length(trim(new.schedule_label)) > 0 and length(trim(new.category)) > 0 and length(trim(new.subcategory)) > 0
    and length(new.image_url) > 0 and new.image_url ~ '^https://'
    and (new.location || new.age_label || new.duration_label || new.schedule_label) !~* '(لم يحدد|غير محدد|يحدده|غير منشور|unknown|unspecified|tba|tbd)'
    and (registration_host = official_host or right(registration_host, length(official_host) + 1) = '.' || official_host)
    and (new.announcement_channel = 'website' or (new.official_account_url is not null and new.official_account_proof_url is not null))
    and cardinality(new.publication_issues) = 0, false);
  if not new.publication_ready then new.is_published := false; end if;
  if new.starts_at <= now() or new.registration_ends_at <= now() then
    new.status := 'closed'; new.is_published := false;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_enforce_complete_learning_announcement on public.learning_opportunities;
create trigger zz_enforce_complete_learning_announcement before insert or update on public.learning_opportunities
for each row execute function private.enforce_complete_learning_announcement();

-- Preserve historical rows for review, but stop exposing seeded/older records.
update public.learning_opportunities set is_published = false, publication_ready = false
where review_policy_version is distinct from 'complete-official-v2';

drop policy if exists learning_opportunities_public_read on public.learning_opportunities;
create policy learning_opportunities_public_read on public.learning_opportunities for select to anon, authenticated
using (is_published and publication_ready and ai_review_status = 'verified'
  and status = 'open' and registration_ends_at > now() and starts_at > now()
  and last_seen_at > now() - interval '24 hours');

create or replace function public.archive_expired_learning_opportunities()
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
commit;
