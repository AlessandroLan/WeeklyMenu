-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists weeks (
  id text primary key,          -- Monday of the week, e.g. '2026-08-24'
  menu jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  week_id text not null references weeks(id) on delete cascade,
  text text not null,
  checked boolean not null default false,
  amount numeric,
  unit text,
  created_at timestamptz not null default now()
);

-- If the table already existed before quantities were added, this backfills
-- the two new columns. Safe to re-run: existing rows keep amount/unit null and
-- simply show no quantity in the app.
alter table shopping_items add column if not exists amount numeric;
alter table shopping_items add column if not exists unit text;

create index if not exists shopping_items_week_id_idx on shopping_items(week_id);

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists weeks_set_updated_at on weeks;
create trigger weeks_set_updated_at
  before update on weeks
  for each row execute function set_updated_at();

-- Row Level Security: since the app has no individual login (just a shared
-- PIN checked in the browser), we allow the public "anon" key full access to
-- these two tables. This is fine for a private, low-stakes household list,
-- but be aware that anyone who obtained the anon key could read or write it
-- too - don't reuse this Supabase project for anything sensitive.
alter table weeks enable row level security;
alter table shopping_items enable row level security;

drop policy if exists "anon full access on weeks" on weeks;
create policy "anon full access on weeks"
  on weeks for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access on shopping_items" on shopping_items;
create policy "anon full access on shopping_items"
  on shopping_items for all
  to anon
  using (true)
  with check (true);

-- Newer Supabase projects no longer grant the API roles access to new tables
-- automatically, so grant it explicitly.
grant select, insert, update, delete on weeks, shopping_items to anon;

-- Realtime: broadcast changes on these tables (same as Database -> Replication
-- in the dashboard). The app currently re-fetches on focus instead of
-- subscribing, but this keeps live sync ready to switch on. Safe to re-run.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'weeks') then
    alter publication supabase_realtime add table weeks;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'shopping_items') then
    alter publication supabase_realtime add table shopping_items;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Dish library ("Piatti"): each dish once, so the app can suggest names while
-- planning, show history, and (later) build the shopping list from ingredients.
-- Meals in weeks.menu stay free text; they match a dish by name.
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text[] not null default '{}',
  -- [{ "text": "pasta", "amount": 500, "unit": "g" }, ...] - filled in phase 3.
  ingredients jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One dish per name, ignoring case ("Lasagna" = "lasagna").
create unique index if not exists dishes_name_unique on dishes (lower(name));

drop trigger if exists dishes_set_updated_at on dishes;
create trigger dishes_set_updated_at
  before update on dishes
  for each row execute function set_updated_at();

alter table dishes enable row level security;

drop policy if exists "anon full access on dishes" on dishes;
create policy "anon full access on dishes"
  on dishes for all
  to anon
  using (true)
  with check (true);

grant select, insert, update, delete on dishes to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'dishes') then
    alter publication supabase_realtime add table dishes;
  end if;
end $$;
