-- Hunter Engine v1: global business directory + private crawl queue.
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.business_directory (
  id uuid primary key default gen_random_uuid(),
  business_key text not null unique,
  name text not null,
  trade_name text not null default '',
  category text not null default '',
  cnae_code text not null default '',
  cnae_description text not null default '',
  city text not null default '',
  state text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  socials jsonb not null default '{}'::jsonb,
  rating numeric(3,2) not null default 0,
  reviews integer not null default 0,
  business_status text not null default 'OPERATIONAL',
  latitude double precision,
  longitude double precision,
  source text not null default 'hunter',
  source_ref text not null default '',
  verified boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_crawled_at timestamptz,
  crawl_status text not null default 'pending',
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists business_directory_city_trgm_idx
  on public.business_directory using gin (lower(city) extensions.gin_trgm_ops);
create index if not exists business_directory_name_trgm_idx
  on public.business_directory using gin (lower(name) extensions.gin_trgm_ops);
create index if not exists business_directory_category_trgm_idx
  on public.business_directory using gin (lower(category) extensions.gin_trgm_ops);
create index if not exists business_directory_cnae_description_trgm_idx
  on public.business_directory using gin (lower(cnae_description) extensions.gin_trgm_ops);
create index if not exists business_directory_verified_idx
  on public.business_directory (verified, city);

alter table public.business_directory enable row level security;
revoke all on table public.business_directory from anon, authenticated;

drop policy if exists "Authenticated can read verified businesses" on public.business_directory;
create policy "Authenticated can read verified businesses"
on public.business_directory for select to authenticated
using (verified = true);

grant select (
  id, business_key, name, trade_name, category, cnae_code, cnae_description,
  city, state, address, phone, email, website, socials, rating, reviews,
  business_status, latitude, longitude, source, source_ref, verified,
  first_seen_at, last_seen_at, last_crawled_at, crawl_status, updated_at
) on public.business_directory to authenticated;

create table if not exists public.crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_directory(id) on delete cascade,
  url text not null,
  job_type text not null default 'website'
    check (job_type in ('website','search','refresh')),
  status text not null default 'queued'
    check (status in ('queued','running','done','failed')),
  priority integer not null default 50,
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  locked_at timestamptz,
  finished_at timestamptz,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crawl_jobs_status_scheduled_idx
  on public.crawl_jobs (status, scheduled_at, priority desc);
create unique index if not exists crawl_jobs_active_url_idx
  on public.crawl_jobs (url, job_type)
  where status in ('queued','running');

alter table public.crawl_jobs enable row level security;
revoke all on table public.crawl_jobs from anon, authenticated;

create or replace function public.search_hunter_directory(
  p_keyword text,
  p_city text,
  p_limit integer default 20
)
returns table (
  business_key text, name text, category text, city text, state text,
  address text, phone text, email text, website text, socials jsonb,
  rating numeric, reviews integer, business_status text,
  latitude double precision, longitude double precision, source text,
  last_seen_at timestamptz, last_crawled_at timestamptz
)
language sql
security invoker
stable
set search_path = public, extensions
as $$
  select
    b.business_key, b.name, coalesce(nullif(b.category,''), b.cnae_description),
    b.city, b.state, b.address, b.phone, b.email, b.website, b.socials,
    b.rating, b.reviews, b.business_status, b.latitude, b.longitude,
    b.source, b.last_seen_at, b.last_crawled_at
  from public.business_directory b
  where b.verified = true
    and (
      lower(b.city) % lower(trim(p_city))
      or lower(b.city) like '%' || lower(trim(p_city)) || '%'
      or lower(trim(p_city)) like '%' || lower(b.city) || '%'
    )
    and (
      lower(b.name) % lower(trim(p_keyword))
      or lower(b.category) % lower(trim(p_keyword))
      or lower(b.cnae_description) % lower(trim(p_keyword))
      or lower(b.name) like '%' || lower(trim(p_keyword)) || '%'
      or lower(b.category) like '%' || lower(trim(p_keyword)) || '%'
      or lower(b.cnae_description) like '%' || lower(trim(p_keyword)) || '%'
    )
  order by
    greatest(
      similarity(lower(b.name), lower(trim(p_keyword))),
      similarity(lower(b.category), lower(trim(p_keyword))),
      similarity(lower(b.cnae_description), lower(trim(p_keyword)))
    ) desc,
    b.rating desc,
    b.reviews desc
  limit least(greatest(coalesce(p_limit,20),1),50);
$$;

revoke all on function public.search_hunter_directory(text,text,integer) from public, anon;
grant execute on function public.search_hunter_directory(text,text,integer) to authenticated;

-- Backfill only real external leads already preserved in HunterX snapshots.
insert into public.business_directory (
  business_key, name, category, city, address, phone, email, website,
  socials, rating, reviews, business_status, latitude, longitude,
  source, source_ref, verified, first_seen_at, last_seen_at, raw
)
select distinct on (
  coalesce(nullif(elem->>'source',''),'unknown') || ':' || coalesce(nullif(elem->>'id',''), md5(elem::text))
)
  coalesce(nullif(elem->>'source',''),'unknown') || ':' || coalesce(nullif(elem->>'id',''), md5(elem::text)),
  coalesce(nullif(elem->>'name',''),'Empresa'),
  coalesce(elem->>'category',''),
  coalesce(elem->>'city',''),
  coalesce(elem->>'address',''),
  coalesce(elem->>'phone',''),
  coalesce(elem->>'email',''),
  coalesce(elem->>'website',''),
  coalesce(elem->'socials','{}'::jsonb),
  case when jsonb_typeof(elem->'rating')='number' then (elem->>'rating')::numeric else 0 end,
  case when jsonb_typeof(elem->'reviews')='number' then (elem->>'reviews')::integer else 0 end,
  coalesce(nullif(elem->>'businessStatus',''),'OPERATIONAL'),
  case when jsonb_typeof(elem->'latitude')='number' then (elem->>'latitude')::double precision else null end,
  case when jsonb_typeof(elem->'longitude')='number' then (elem->>'longitude')::double precision else null end,
  coalesce(nullif(elem->>'source',''),'unknown'),
  coalesce(elem->>'id',''),
  true,
  s.created_at,
  s.created_at,
  elem
from public.search_snapshots s
cross join lateral jsonb_array_elements(s.leads) elem
where elem->>'source' in ('apify','outscraper')
on conflict (business_key) do update
set
  name = excluded.name,
  category = excluded.category,
  city = excluded.city,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email,
  website = excluded.website,
  socials = excluded.socials,
  rating = excluded.rating,
  reviews = excluded.reviews,
  business_status = excluded.business_status,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  verified = true,
  last_seen_at = greatest(public.business_directory.last_seen_at, excluded.last_seen_at),
  raw = excluded.raw,
  updated_at = now();
