-- ─────────────────────────────────────────────────────────────
-- Tate's Recipes — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

-- Recipes (ingredients, instructions, and photos stored as JSONB
-- for simplicity; they can be extracted into their own tables in
-- a future phase when grocery/pantry queries need it)

create table if not exists recipes (
  id            uuid          default gen_random_uuid() primary key,
  title         text          not null,
  description   text          not null default '',
  category      text          not null default 'Dinner',
  prep_time     integer,
  cook_time     integer,
  total_time    integer,
  servings      integer,
  difficulty    text,
  hero_image    text          not null default '',
  source_url    text          not null default '',
  source_name   text          not null default '',
  created_by_tate boolean     not null default false,
  tates_tips    text          not null default '',
  is_favorite   boolean       not null default false,
  tags          text[]        not null default '{}',
  ingredients   jsonb         not null default '[]',
  instructions  jsonb         not null default '[]',
  photos        jsonb         not null default '[]',
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- Auto-update updated_at on every row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_updated_at on recipes;
create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- Row Level Security — open policy for a personal single-user app.
-- Lock this down with auth.uid() checks if you add login later.
alter table recipes enable row level security;

drop policy if exists "Allow all" on recipes;
create policy "Allow all" on recipes
  for all using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for food photos
-- Run separately in: Storage → New bucket → name: recipe-photos → Public: ON
-- OR paste this (requires pg_storage extension to be enabled):
-- select storage.create_bucket('recipe-photos', object_limit := null, file_size_limit := 10485760, allowed_mime_types := array['image/jpeg','image/png','image/webp','image/gif']);
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- Kitchen data: collections, meal plan, grocery list, cook log.
-- One JSON document per key. Optional: without this table the app
-- keeps that data in the browser only. Run it to sync across devices.
-- ─────────────────────────────────────────────────────────────
create table if not exists app_state (
  key         text          primary key,
  value       jsonb         not null default '[]',
  updated_at  timestamptz   not null default now()
);

alter table app_state enable row level security;

drop policy if exists "Allow all" on app_state;
create policy "Allow all" on app_state
  for all using (true) with check (true);
