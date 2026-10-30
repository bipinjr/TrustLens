-- Scam Radar schema. Run once in the Supabase SQL editor.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scam_type text not null check (char_length(scam_type) between 2 and 80),
  verdict text not null check (verdict in ('scam', 'suspicious', 'likely_safe')),
  risk smallint not null check (risk between 0 and 100),
  principles text[] not null default '{}' check (
    cardinality(principles) <= 7
    and principles <@ array['time','social_compliance','need_greed','distraction','kindness','herd','dishonesty']
  ),
  channel text not null default 'other' check (channel in ('sms', 'whatsapp', 'email', 'call', 'other')),
  language text not null default 'English' check (char_length(language) <= 20),
  state text check (state is null or char_length(state) <= 40),
  excerpt text not null check (char_length(excerpt) between 5 and 280),
  domains text[] not null default '{}' check (cardinality(domains) <= 5),
  is_seed boolean not null default false
);

create index reports_created_at_idx on public.reports (created_at desc);

alter table public.reports enable row level security;

-- Public, anonymous radar: anyone can read and add reports; nobody can update or delete via the API.
create policy "Anyone can read reports" on public.reports
  for select to anon, authenticated using (true);

create policy "Anyone can add a report" on public.reports
  for insert to anon, authenticated
  with check (is_seed = false and created_at > now() - interval '5 minutes');

-- Aggregates for the radar dashboard, computed in the database.
create or replace function public.radar_summary(days int default 14)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with r as (
    select * from public.reports
    where created_at > now() - make_interval(days => least(greatest(days, 1), 90))
  )
  select json_build_object(
    'total', (select count(*) from r),
    'scams', (select count(*) from r where verdict = 'scam'),
    'avg_risk', (select coalesce(round(avg(risk)), 0) from r),
    'seeded', (select count(*) from r where is_seed),
    'by_type', (select coalesce(json_agg(t order by t.n desc), '[]') from (
      select scam_type as label, count(*) as n from r where verdict <> 'likely_safe' group by scam_type order by n desc limit 6) t),
    'by_principle', (select coalesce(json_agg(p order by p.n desc), '[]') from (
      select unnest(principles) as id, count(*) as n from r group by 1) p),
    'by_channel', (select coalesce(json_agg(c order by c.n desc), '[]') from (
      select channel as label, count(*) as n from r group by channel) c),
    'by_day', (select coalesce(json_agg(d order by d.day), '[]') from (
      select date_trunc('day', created_at)::date as day, count(*) as n from r group by 1) d),
    'top_domains', (select coalesce(json_agg(x order by x.n desc), '[]') from (
      select unnest(domains) as label, count(*) as n from r group by 1 order by 2 desc limit 5) x)
  );
$$;

grant execute on function public.radar_summary(int) to anon, authenticated;
