-- ─────────────────────────────────────────────────────────────
-- Portfolio site content — run this once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ─────────────────────────────────────────────────────────────

-- One row holds the entire site's content as jsonb.
create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1), -- singleton row
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Anyone may read (the public site renders from this).
drop policy if exists "public read" on public.site_content;
create policy "public read"
  on public.site_content for select
  using (true);

-- Only signed-in users (you, via /admin) may write.
drop policy if exists "authenticated insert" on public.site_content;
create policy "authenticated insert"
  on public.site_content for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update" on public.site_content;
create policy "authenticated update"
  on public.site_content for update
  to authenticated
  using (true)
  with check (true);

-- No delete policy: the singleton row can't be removed via the API.
