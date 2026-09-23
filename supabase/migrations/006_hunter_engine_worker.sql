-- Hunter Engine worker: atomically claim crawl jobs.
create or replace function public.claim_crawl_jobs(p_limit integer default 5)
returns setof public.crawl_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with picked as (
    select id
    from public.crawl_jobs
    where status = 'queued'
      and scheduled_at <= now()
    order by priority desc, scheduled_at asc
    for update skip locked
    limit least(greatest(coalesce(p_limit,5),1),25)
  )
  update public.crawl_jobs j
  set
    status = 'running',
    attempts = j.attempts + 1,
    locked_at = now(),
    updated_at = now()
  from picked
  where j.id = picked.id
  returning j.*;
end;
$$;

revoke all on function public.claim_crawl_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_crawl_jobs(integer) to service_role;
