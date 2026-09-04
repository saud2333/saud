-- Keep every registration call-to-action inside the organizer's official web domain.

create or replace function private.normalize_learning_opportunity_registration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organizer ~* '(KGBC|المباني الخضراء)'
    and new.registration_url !~* '^https?://([^/]+\.)?kuwaitgbc\.com(?:/|$)' then
    new.registration_url := 'https://www.kuwaitgbc.com/events';
  elsif new.organizer ~* '(KFAS|التقدم العلمي)'
    and new.registration_url !~* '^https?://([^/]+\.)?kfas\.org\.kw(?:/|$)' then
    new.registration_url := 'https://apply.kfas.org.kw/';
  elsif new.organizer ~* '(KISR|الأبحاث العلمية)'
    and new.registration_url !~* '^https?://([^/]+\.)?kisr\.edu\.kw(?:/|$)' then
    new.registration_url := 'https://www.kisr.edu.kw/ar/careers-training/training-courses/';
  elsif new.organizer ~* '(SACGC|صباح الأحمد)'
    and new.registration_url !~* '^https?://([^/]+\.)?sacgc\.org(?:/|$)' then
    new.registration_url := 'https://sacgc.org/en/';
  elsif new.organizer ~* 'جامعة الكويت.*مركز خدمة المجتمع'
    and new.registration_url !~* '^https?://([^/]+\.)?ku\.edu\.kw(?:/|$)' then
    new.registration_url := 'https://ccsce.ku.edu.kw/';
  elsif new.organizer ~* 'جامعة الكويت'
    and new.registration_url !~* '^https?://([^/]+\.)?ku\.edu\.kw(?:/|$)' then
    new.registration_url := 'https://engineering.ku.edu.kw/ar/vdpct/about/office-consultation-and-training';
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_learning_opportunity_registration on public.learning_opportunities;
create trigger normalize_learning_opportunity_registration
before insert or update of organizer, registration_url on public.learning_opportunities
for each row execute function private.normalize_learning_opportunity_registration();

-- Re-run every existing row through the trigger so previously stored external forms are removed.
update public.learning_opportunities
set registration_url = registration_url;

comment on function private.normalize_learning_opportunity_registration() is
  'Replaces off-domain registration URLs with the organizer official landing page.';
