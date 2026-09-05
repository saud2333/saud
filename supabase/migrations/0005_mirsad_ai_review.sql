-- Second-pass AI review metadata for opportunities collected from official pages.

alter table public.learning_opportunities
  add column if not exists content_hash text,
  add column if not exists ai_review_status text not null default 'pending'
    check (ai_review_status in ('pending', 'verified', 'needs_review', 'unavailable')),
  add column if not exists ai_reviewed_at timestamptz,
  add column if not exists ai_review_note text,
  add column if not exists ai_review_model text;

create index if not exists learning_opportunities_ai_review_status_idx
  on public.learning_opportunities (ai_review_status, is_published);

comment on column public.learning_opportunities.content_hash is
  'Hash of factual fields; verified records are reviewed again when this changes.';

comment on column public.learning_opportunities.ai_review_status is
  'Second-pass review against text fetched from the official source page.';

comment on column public.learning_opportunities.ai_review_note is
  'Short reviewer explanation. AI corrections are never applied automatically.';
