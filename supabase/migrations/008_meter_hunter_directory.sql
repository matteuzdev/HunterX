-- Meter all Hunter Directory data access through tokens.

revoke select on public.business_directory from authenticated;
drop policy if exists "Authenticated can read verified businesses" on public.business_directory;

create or replace function public.count_hunter_directory_matches(
 p_keyword text,p_city text,p_limit integer default 20
)
returns integer
language sql security definer stable set search_path=public,extensions
as $$
 select count(*)::integer from (
   select 1 from public.business_directory b
   where b.verified=true
     and (
       lower(b.city)%lower(trim(p_city))
       or lower(b.city) like '%'||lower(trim(p_city))||'%'
       or lower(trim(p_city)) like '%'||lower(b.city)||'%'
     )
     and (
       lower(b.name)%lower(trim(p_keyword))
       or lower(b.category)%lower(trim(p_keyword))
       or lower(b.cnae_description)%lower(trim(p_keyword))
       or lower(b.name) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.category) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.cnae_description) like '%'||lower(trim(p_keyword))||'%'
     )
   limit least(greatest(coalesce(p_limit,20),1),20)
 ) q;
$$;

revoke all on function public.count_hunter_directory_matches(text,text,integer) from public,anon;
grant execute on function public.count_hunter_directory_matches(text,text,integer) to authenticated;

create or replace function public.search_hunter_directory_metered(
 p_keyword text,p_city text,p_limit integer default 20,p_reference text default ''
)
returns table(
 business_key text,name text,category text,city text,state text,address text,phone text,email text,
 website text,socials jsonb,rating numeric,reviews integer,business_status text,
 latitude double precision,longitude double precision,source text,last_seen_at timestamptz,
 last_crawled_at timestamptz,token_balance integer
)
language plpgsql security definer set search_path=public,extensions
as $$
declare
 uid uuid := (select auth.uid());
 lim integer := least(greatest(coalesce(p_limit,20),1),20);
 cost integer;
 new_balance integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform public.ensure_hunter_account();

 select count(*)::integer into cost from (
   select 1 from public.business_directory b
   where b.verified=true
     and (
       lower(b.city)%lower(trim(p_city))
       or lower(b.city) like '%'||lower(trim(p_city))||'%'
       or lower(trim(p_city)) like '%'||lower(b.city)||'%'
     )
     and (
       lower(b.name)%lower(trim(p_keyword))
       or lower(b.category)%lower(trim(p_keyword))
       or lower(b.cnae_description)%lower(trim(p_keyword))
       or lower(b.name) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.category) like '%'||lower(trim(p_keyword))||'%'
       or lower(b.cnae_description) like '%'||lower(trim(p_keyword))||'%'
     )
   limit lim
 ) q;

 if cost>0 then
   update public.token_wallets
   set balance=balance-cost,lifetime_spent=lifetime_spent+cost,updated_at=now()
   where user_id=uid and balance>=cost
   returning balance into new_balance;
   if new_balance is null then raise exception 'INSUFFICIENT_TOKENS'; end if;

   insert into public.token_ledger(user_id,delta,kind,reference,metadata)
   values(uid,-cost,'search',coalesce(p_reference,''),
     jsonb_build_object('provider','hunter','count',cost,'keyword',p_keyword,'city',p_city));
 else
   select balance into new_balance from public.token_wallets where user_id=uid;
 end if;

 return query
 select b.business_key,b.name,coalesce(nullif(b.category,''),b.cnae_description),
        b.city,b.state,b.address,b.phone,b.email,b.website,b.socials,b.rating,b.reviews,
        b.business_status,b.latitude,b.longitude,b.source,b.last_seen_at,b.last_crawled_at,new_balance
 from public.business_directory b
 where b.verified=true
   and (
     lower(b.city)%lower(trim(p_city))
     or lower(b.city) like '%'||lower(trim(p_city))||'%'
     or lower(trim(p_city)) like '%'||lower(b.city)||'%'
   )
   and (
     lower(b.name)%lower(trim(p_keyword))
     or lower(b.category)%lower(trim(p_keyword))
     or lower(b.cnae_description)%lower(trim(p_keyword))
     or lower(b.name) like '%'||lower(trim(p_keyword))||'%'
     or lower(b.category) like '%'||lower(trim(p_keyword))||'%'
     or lower(b.cnae_description) like '%'||lower(trim(p_keyword))||'%'
   )
 order by greatest(
   similarity(lower(b.name),lower(trim(p_keyword))),
   similarity(lower(b.category),lower(trim(p_keyword))),
   similarity(lower(b.cnae_description),lower(trim(p_keyword)))
 ) desc,b.rating desc,b.reviews desc
 limit lim;
end;
$$;

revoke all on function public.search_hunter_directory_metered(text,text,integer,text) from public,anon;
grant execute on function public.search_hunter_directory_metered(text,text,integer,text) to authenticated;

revoke execute on function public.search_hunter_directory(text,text,integer) from authenticated;
grant execute on function public.search_hunter_directory(text,text,integer) to service_role;
