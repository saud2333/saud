-- A factual caption distinguishes provider logos from course photography.
alter table public.learning_opportunities add column if not exists image_caption text;
