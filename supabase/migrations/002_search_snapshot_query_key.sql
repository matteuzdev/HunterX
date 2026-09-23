-- Add normalized query key for reliable cache lookups.
alter table public.search_snapshots
  add column if not exists query_key text;

update public.search_snapshots
set query_key = lower(trim(keyword)) || '::' || lower(trim(city))
where query_key is null or query_key = '';

alter table public.search_snapshots
  alter column query_key set not null;

create index if not exists search_snapshots_user_query_created_idx
  on public.search_snapshots (user_id, query_key, created_at desc);
