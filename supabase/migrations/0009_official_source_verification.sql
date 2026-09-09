-- Add transparent non-AI verification; preserve private evidence and server-only writes.
begin;
alter table public.learning_opportunities
  add column if not exists verification_method text not null default 'ai' check (verification_method in ('ai','official_source')),
  add column if not exists verified_at timestamptz,
  add column if not exists verifier_version text,
  add column if not exists verification_note text;

create or replace function private.enforce_complete_learning_announcement()
returns trigger language plpgsql set search_path = '' as $$
declare official_host text; registration_host text; all_evidence boolean; age_evidence boolean; price_evidence boolean;
begin
  if new.min_age is null and new.max_age is null then new.age_label := 'غير معلن من الجهة'; end if;
  select regexp_replace(lower(substring(website_url from '^https://([^/?#]+)')), '^www\.', '')
    into official_host from public.learning_sources where id = new.source_id and is_active;
  registration_host := lower(substring(new.registration_url from '^https://([^/?#]+)'));
  select count(distinct claim->>'field') = 7 into all_evidence
    from jsonb_array_elements(case when jsonb_typeof(new.field_evidence) = 'array' then new.field_evidence else '[]'::jsonb end) claim
    where claim->>'field' in ('title','description','kind','schedule','location','mode','registration')
      and length(trim(claim->>'quote')) > 0;
  select exists(select 1 from jsonb_array_elements(case when jsonb_typeof(new.field_evidence) = 'array' then new.field_evidence else '[]'::jsonb end) claim where claim->>'field' = 'age' and length(trim(claim->>'quote')) > 0) into age_evidence;
  select exists(select 1 from jsonb_array_elements(case when jsonb_typeof(new.field_evidence) = 'array' then new.field_evidence else '[]'::jsonb end) claim where claim->>'field' = 'price' and length(trim(claim->>'quote')) > 0) into price_evidence;
  new.publication_ready := coalesce(
    ((new.verification_method = 'ai' and new.ai_review_status = 'verified' and new.ai_reviewed_at is not null)
      or (new.verification_method = 'official_source' and new.ai_review_status = 'unavailable'
        and new.verifier_version = 'official-parser-v1' and new.verified_at > now() - interval '24 hours' and new.verified_at <= now()))
    and new.review_policy_version = 'official-nullable-age-fees-v3'
    and length(new.evidence_hash) = 64 and length(new.registration_page_hash) = 64 and all_evidence
    and new.registration_state = 'open'
    and new.starts_at > now() and new.ends_at >= new.starts_at
    and new.registration_ends_at > now() and new.registration_ends_at <= new.starts_at
    and ((new.min_age is null and new.max_age is null) or (age_evidence
      and length(trim(new.age_label)) > 0
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
  if new.starts_at <= now() or new.registration_ends_at <= now() then
    new.status := 'closed'; new.is_published := false;
  end if;
  return new;
end;
$$;

-- Anonymous access remains restricted to validated, fresh, open public announcements.
drop policy if exists learning_opportunities_public_read on public.learning_opportunities;
create policy learning_opportunities_public_read on public.learning_opportunities for select to anon,authenticated
using (is_published and publication_ready and status = 'open' and registration_state = 'open'
  and starts_at > now() and registration_ends_at > now() and last_seen_at > now() - interval '24 hours'
  and ((verification_method = 'ai' and ai_review_status = 'verified')
    or (verification_method = 'official_source' and ai_review_status = 'unavailable'
      and verifier_version = 'official-parser-v1' and verified_at > now() - interval '24 hours' and verified_at <= now())));
notify pgrst, 'reload schema';
commit;

