-- Mirsad: public course and workshop catalog.
-- Apply after 0001_civilkuwait_platform.sql in the Supabase SQL editor.

create table if not exists public.learning_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  website_url text not null unique,
  feed_url text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_opportunities (
  id text primary key check (char_length(id) between 3 and 120),
  source_id uuid references public.learning_sources(id) on delete set null,
  title_ar text not null check (char_length(title_ar) between 3 and 240),
  title_en text check (char_length(title_en) <= 240),
  description_ar text not null default '' check (char_length(description_ar) <= 1800),
  kind text not null default 'course' check (kind in ('course', 'workshop', 'camp')),
  category text not null,
  subcategory text not null default 'عام',
  organizer text not null,
  location text not null default 'الكويت',
  governorate text not null default 'غير محدد',
  mode text not null default 'in_person' check (mode in ('in_person', 'online', 'hybrid')),
  min_age smallint check (min_age is null or min_age between 3 and 99),
  max_age smallint check (max_age is null or max_age between 3 and 99),
  age_label text not null default 'لم يحدده المنظم',
  duration_label text not null default 'يحدده المنظم',
  schedule_label text not null default 'الموعد يحدده المنظم',
  starts_at timestamptz,
  ends_at timestamptz,
  price_kwd numeric(10,3) check (price_kwd is null or price_kwd >= 0),
  status text not null default 'verify' check (status in ('open', 'verify', 'closed')),
  registration_url text not null,
  source_url text not null,
  image_url text not null default '/courses-skills.png',
  tags text[] not null default '{}',
  featured boolean not null default false,
  is_published boolean not null default false,
  source_checked_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_age is null or min_age is null or max_age >= min_age)
);

create index if not exists learning_opportunities_discovery_idx
  on public.learning_opportunities (is_published, featured desc, category, status);
create index if not exists learning_opportunities_age_idx
  on public.learning_opportunities (min_age, max_age);
create index if not exists learning_opportunities_starts_at_idx
  on public.learning_opportunities (starts_at);

drop trigger if exists set_updated_at on public.learning_sources;
create trigger set_updated_at before update on public.learning_sources
for each row execute function private.touch_updated_at();

drop trigger if exists set_updated_at on public.learning_opportunities;
create trigger set_updated_at before update on public.learning_opportunities
for each row execute function private.touch_updated_at();

alter table public.learning_sources enable row level security;
alter table public.learning_opportunities enable row level security;

revoke all on table public.learning_sources, public.learning_opportunities from anon, authenticated;
grant select on table public.learning_sources, public.learning_opportunities to anon, authenticated;

drop policy if exists learning_sources_public_read on public.learning_sources;
create policy learning_sources_public_read on public.learning_sources
for select to anon, authenticated using (is_active = true);

drop policy if exists learning_opportunities_public_read on public.learning_opportunities;
create policy learning_opportunities_public_read on public.learning_opportunities
for select to anon, authenticated using (is_published = true);

-- Mutations intentionally have no browser policy. Scheduled GitHub Actions or a
-- trusted ingestion service should write with a server-side secret.

insert into public.learning_sources (name, website_url, feed_url, last_synced_at)
values
  ('جامعة الكويت — كلية الهندسة والبترول', 'https://engineering.ku.edu.kw/', 'https://engineering.ku.edu.kw/ar/vdpct/about/office-consultation-and-training', now()),
  ('جامعة الكويت — مركز خدمة المجتمع والتعليم المستمر', 'https://ccsce.ku.edu.kw/', 'https://ccsce.ku.edu.kw/', now())
on conflict (website_url) do update set
  name = excluded.name,
  feed_url = excluded.feed_url,
  is_active = true,
  last_synced_at = excluded.last_synced_at;

insert into public.learning_opportunities (
  id, source_id, title_ar, title_en, description_ar, kind, category, subcategory,
  organizer, location, governorate, mode, min_age, max_age, age_label,
  duration_label, schedule_label, price_kwd, status, registration_url, source_url,
  image_url, tags, featured, is_published, source_checked_at
)
select
  'ku-me004-service-robotics', id, 'الروبوتات الخدمية للصناعة', 'Service Robotics for Industry',
  'تدريب تطبيقي على الروبوتات الأرضية والجوية والرباعية واستخدامها في الفحص والمراقبة والدعم التشغيلي.',
  'course', 'التقنية والذكاء الاصطناعي', 'روبوتات', name,
  'مدينة صباح السالم الجامعية، الشدادية', 'العاصمة', 'in_person', null, null,
  'لم يحدده المنظم', '4 أيام', '8:00 ص — 2:00 م · الموعد يحدده المنظم', 3500,
  'verify', 'https://forms.office.com/r/X4dGhF6Aax?origin=lprLink',
  'https://engineering.ku.edu.kw/sites/default/files/2025-11/Service%20Robotics%20for%20Industry.pdf',
  '/courses-tech.png', array['روبوتات','صناعة','تطبيقي'], true, true, '2026-09-04'
from public.learning_sources where website_url = 'https://engineering.ku.edu.kw/'
on conflict (id) do update set source_checked_at = excluded.source_checked_at, is_published = excluded.is_published;

insert into public.learning_opportunities (
  id, source_id, title_ar, title_en, description_ar, kind, category, subcategory,
  organizer, location, governorate, mode, age_label, duration_label, schedule_label,
  status, registration_url, source_url, image_url, tags, featured, is_published, source_checked_at
)
select
  'ku-me006-solar-sizing', id, 'تحديد حجم نظام الطاقة الشمسية', 'Solar Energy System Sizing',
  'منهجية تحديد حجم الألواح الشمسية، تحليل الأحمال، مكونات النظام وتقدير الأداء في سياق الكويت.',
  'course', 'الهندسة والطاقة', 'طاقة متجددة', name,
  'مدينة صباح السالم الجامعية، الشدادية', 'العاصمة', 'in_person', 'لم يحدده المنظم',
  'يومان', '8:00 ص — 2:00 م · الموعد يحدده المنظم', 'verify',
  'https://forms.office.com/r/X4dGhF6Aax?origin=lprLink',
  'https://engineering.ku.edu.kw/sites/default/files/2025-12/ME006-%20Solar%20Energy%20System%20Sizing.pdf',
  '/courses-engineering.png', array['طاقة شمسية','استدامة','هندسة'], true, true, '2026-09-04'
from public.learning_sources where website_url = 'https://engineering.ku.edu.kw/'
on conflict (id) do update set source_checked_at = excluded.source_checked_at, is_published = excluded.is_published;

insert into public.learning_opportunities (
  id, source_id, title_ar, title_en, description_ar, kind, category, subcategory,
  organizer, location, governorate, mode, age_label, duration_label, schedule_label,
  status, registration_url, source_url, image_url, tags, featured, is_published, source_checked_at
)
select
  'ku-me010-latex', id, 'ورشة عمل LaTeX وOverleaf', 'LaTeX Workshop',
  'مقدمة عملية لاستخدام LaTeX وOverleaf في كتابة التقارير والأوراق الأكاديمية بصورة احترافية ومنظمة.',
  'workshop', 'الأعمال والمهارات', 'بحث وكتابة', name,
  'مدينة صباح السالم الجامعية، الشدادية', 'العاصمة', 'in_person', 'لم يحدده المنظم',
  'يوم واحد', '8:00 ص — 2:00 م · الموعد يحدده المنظم', 'verify',
  'https://forms.office.com/r/X4dGhF6Aax?origin=lprLink',
  'https://engineering.ku.edu.kw/sites/default/files/2025-12/ME0010-%20LaTeX%20Workshop.pdf',
  '/courses-skills.png', array['LaTeX','Overleaf','أكاديمي'], true, true, '2026-09-04'
from public.learning_sources where website_url = 'https://engineering.ku.edu.kw/'
on conflict (id) do update set source_checked_at = excluded.source_checked_at, is_published = excluded.is_published;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'learning_opportunities'
  ) then
    alter publication supabase_realtime add table public.learning_opportunities;
  end if;
end $$;

comment on table public.learning_opportunities is
  'Verified learning opportunities shown in Mirsad. Unknown facts remain null or explicitly unspecified.';
