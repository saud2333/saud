# مرصاد — تشغيل البوت

The GitHub workflow `Sync Mirsad opportunities` runs on `main` with a half-hour schedule and supports manual dispatch. GitHub can delay scheduled runs; this is not a guaranteed real-time SLA. The website shows each source's actual last check, detects old checks, reloads the catalog every minute, and hides closed/started courses. Supabase RLS independently enforces expiry on every read. Records are archived, never hard-deleted.

## Current verification mode

`BOT_VERIFICATION_MODE=official_source` uses deterministic official-page extraction, **not AI review**. It requires the existing `SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY` GitHub secrets. Apply `supabase/migrations/0009_official_source_verification.sql` before enabling this mode on an existing catalog. No server credentials belong in the frontend or repository.

CODED, KGBC, KISR, SACGC and KFAS are monitored; existing Kuwait University sources are retained. The explicit KFAS local-program adapter and complete JSON-LD course/event adapter can automatically publish future announcements in supported formats. A checked source does **not** mean that every announcement on it can be parsed. Changed templates, missing registration deadlines, inquiry-only pages, unsupported eligibility/fee data and image-only announcements are held or recorded as unsupported, never filled with invented facts. Registration buttons lead to the specific official course page.

Numeric ages and fees stay null when not announced. Professional experience is not a participant's age. Official embedded raster images are mirrored by immutable content hash in the `mirsad-official-images` Supabase bucket, then downloaded and byte-verified before publishing. Existing private buckets are not made public automatically.

The bot refreshes evidence from the source on each pass, reconciles only the exact fetched page, keeps private evidence in `learning_source_documents`, and preserves reviewed Arabic titles only when the official English title is unchanged. Descriptions remain in the source language in deterministic mode. Source failures and unsupported documents are reported separately; they do not silently turn into zero-course assertions.

## Coverage limits

Instagram and X require their official API credentials and remain disconnected. Public YouTube feeds are discovery-only in deterministic mode: they can supply official website links, but video/image content is not automatically verified. No OCR or AI claim is made. Sources blocking server access are reported as partial/failed and retried at the next scheduled run.

To opt into the separate AI pipeline later, provision the authorized OpenAI key and change `BOT_VERIFICATION_MODE` to `ai`. Its independent review checks remain intact. Setting a mode incorrectly fails preflight rather than changing catalog data.

## Verification

- Run `npm test` before deployment.
- Use the workflow's `check_only` option for a read-only connection test; this is not a completed sync.
- A full dispatch has `check_only` unchecked. Inspect the source reports and Supabase `last_synced_at`, not just the green workflow result. Optional website failures can coexist with a completed batch.
- Public clients must never be able to read private evidence or write catalog rows. Expired records must be absent from anonymous queries even if the scheduler is late.
