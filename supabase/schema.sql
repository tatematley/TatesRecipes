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

-- Row Level Security — anyone can read; only the signed-in admin can write.
-- Create the admin in Authentication → Users → Add user, and turn off
-- "Allow new users to sign up" (Authentication → Sign In / Providers)
-- so nobody else can make an account.
alter table recipes enable row level security;

drop policy if exists "Allow all" on recipes;
drop policy if exists "Anyone can read" on recipes;
drop policy if exists "Admin can write" on recipes;
create policy "Anyone can read" on recipes
  for select using (true);
create policy "Admin can write" on recipes
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for food photos
-- Run separately in: Storage → New bucket → name: recipe-photos → Public: ON
-- OR paste this (requires pg_storage extension to be enabled):
-- select storage.create_bucket('recipe-photos', object_limit := null, file_size_limit := 10485760, allowed_mime_types := array['image/jpeg','image/png','image/webp','image/gif']);
-- ─────────────────────────────────────────────────────────────

-- Only the signed-in admin can upload or remove photos (public bucket stays readable)
drop policy if exists "Admin can upload photos" on storage.objects;
create policy "Admin can upload photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'recipe-photos') with check (bucket_id = 'recipe-photos');

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
