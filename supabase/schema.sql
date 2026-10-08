begin;
create table if not exists public.athlete_state (
 athlete_id uuid primary key references auth.users(id) on delete cascade,
 body jsonb not null check(jsonb_typeof(body)='object'),
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
create table if not exists public.strength_sessions (
 athlete_id uuid not null references auth.users(id) on delete cascade,
 session_id text not null,
 session_date date not null,
 body jsonb not null check(jsonb_typeof(body)='object'),
 updated_at timestamptz not null default now(),
 primary key(athlete_id,session_id)
);
create table if not exists public.pace_observations (
 athlete_id uuid not null references auth.users(id) on delete cascade,
 observed_date date not null,
 source text not null check(source in ('coros','coach')),
 paces jsonb not null check(jsonb_typeof(paces)='object'),
 observed_at timestamptz not null,
 primary key(athlete_id,observed_date,source)
);
create table if not exists public.coros_observations (
 athlete_id uuid not null references auth.users(id) on delete cascade,
 observed_at timestamptz not null,
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
 primary key(athlete_id,observed_at)
);
create table if not exists public.weekly_reviews (
 athlete_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null check(extract(isodow from week_start)=1),
 ranges jsonb not null check(jsonb_typeof(ranges)='object'),
 rationale text not null,
 evidence jsonb not null default '{}',
 coros_send_results jsonb not null default '[]',
 reviewed_at timestamptz not null default now(),
 primary key(athlete_id,week_start)
);
create index if not exists strength_session_dates on public.strength_sessions(athlete_id,session_date desc);
do $$ declare t text; begin
 foreach t in array array['athlete_state','strength_sessions','pace_observations','coros_observations','weekly_reviews'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('drop policy if exists own_rows on public.%I',t);
 execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid())=athlete_id) with check ((select auth.uid())=athlete_id)',t);
 execute format('revoke all on public.%I from anon',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create or replace function public.save_stride_state(p_body jsonb,p_expected_revision bigint)
returns bigint language plpgsql security invoker set search_path=public as $$
declare uid uuid:=auth.uid(); current_revision bigint; result_revision bigint; item jsonb;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_body)<>'object' or coalesce(jsonb_typeof(p_body->'strengthLogs'),'')<>'array' or coalesce(jsonb_typeof(p_body->'routines'),'')<>'array' or octet_length(p_body::text)>2000000 then raise exception 'Invalid state'; end if;
 insert into public.athlete_state(athlete_id,body,revision) values(uid,p_body,0) on conflict do nothing;
 select revision into current_revision from public.athlete_state where athlete_id=uid for update;
 if p_expected_revision is null or current_revision<>p_expected_revision then raise exception 'STRIDE_CONFLICT'; end if;
 update public.athlete_state set body=p_body,revision=revision+1,updated_at=now() where athlete_id=uid returning revision into result_revision;
 -- All mutations occur in this transaction; a failed write leaves the previous state intact.
 delete from public.strength_sessions where athlete_id=uid and session_id not in(select x->>'id' from jsonb_array_elements(p_body->'strengthLogs') x);
 for item in select * from jsonb_array_elements(p_body->'strengthLogs') loop
  if item->>'id' is null or coalesce(jsonb_typeof(item->'exercises'),'')<>'array' then raise exception 'Invalid strength session'; end if;
  insert into public.strength_sessions(athlete_id,session_id,session_date,body) values(uid,item->>'id',(item->>'date')::date,item)
  on conflict(athlete_id,session_id) do update set session_date=excluded.session_date,body=excluded.body,updated_at=now();
 end loop;
 for item in select * from jsonb_array_elements(coalesce(p_body->'paceHistory','[]')) loop
  if item->>'source' not in('coros','coach') or jsonb_typeof(item->'paces')<>'object' then raise exception 'Invalid pace observation'; end if;
  if exists(select 1 from jsonb_each(item->'paces') v where v.key not in('five','ten','half','marathon') or jsonb_typeof(v.value)<>'number' or (v.value::text)::numeric<=0) then raise exception 'Invalid pace value'; end if;
  insert into public.pace_observations(athlete_id,observed_date,source,paces,observed_at)
  values(uid,(item->>'date')::date,item->>'source',item->'paces',coalesce((item->>'observedAt')::timestamptz,now()))
  on conflict(athlete_id,observed_date,source) do update set paces=excluded.paces,observed_at=excluded.observed_at where excluded.observed_at >= public.pace_observations.observed_at;
 end loop;
 return result_revision;
end $$;
revoke all on function public.save_stride_state(jsonb,bigint) from public,anon;
grant execute on function public.save_stride_state(jsonb,bigint) to authenticated;
commit;
