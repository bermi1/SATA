-- SATA platform schema. All access goes through the Next.js server using the service-role key,
-- which bypasses RLS. RLS is enabled on every table with NO policies, so the public anon key
-- (and any logged-in Supabase user) can read or write nothing directly.

create sequence if not exists member_no_seq start 1;
create sequence if not exists receipt_seq start 1;

create table members (
  id text primary key,
  member_no text not null unique,
  name text not null,
  email text not null,
  phone text not null,
  category text not null check (category in ('full','associate','honorary')),
  cadre text not null,
  facility text not null,
  region text not null,
  status text not null default 'pending' check (status in ('pending','active','lapsed','suspended')),
  paid_through timestamptz,
  cpd_points int not null default 0,
  joined_at timestamptz not null default now(),
  role text not null default 'member' check (role in ('member','secretariat','treasurer','leadership')),
  department_ids text[] not null default '{}',
  last_reminder_at timestamptz
);
create unique index members_email_key on members (lower(email));

create table departments (
  id text primary key,
  name text not null unique,
  mandate text not null,
  head_member_id text references members(id) on delete set null,
  proposed boolean not null default false
);

create table officers (
  id text primary key,
  title text not null,
  name text not null,
  member_id text references members(id) on delete set null,
  rank int not null
);

create table events (
  id text primary key,
  slug text not null unique,
  title text not null,
  type text not null check (type in ('conference','agm','workshop','webinar','meeting','marathon','training')),
  mode text not null check (mode in ('physical','online','hybrid')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  dates_tbc boolean,
  venue text not null,
  link text,
  summary text not null,
  theme text,
  capacity int,
  cpd_points int not null default 0,
  fees jsonb not null default '{}',
  minutes_required int,
  department_id text,
  sample boolean,
  external_url text,
  image text,
  status text not null default 'published' check (status in ('draft','published','cancelled')),
  check (ends_at >= starts_at)
);

create table registrations (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  member_id text references members(id) on delete cascade,
  guest_name text,
  guest_email text,
  guest_phone text,
  ticket_code text not null unique,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  check (member_id is not null or guest_name is not null),
  unique (event_id, member_id)
);
create index registrations_event_idx on registrations (event_id);

create table attendance (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  member_id text references members(id) on delete cascade,
  guest_name text,
  checked_in_at timestamptz not null default now(),
  method text not null check (method in ('qr','manual','online')),
  minutes int,
  counted boolean not null default true,
  unique (event_id, member_id)
);
create index attendance_event_idx on attendance (event_id);

create table payments (
  id text primary key,
  member_id text references members(id),
  suggested_member_id text,
  event_id text,
  payer_name text not null,
  purpose text not null check (purpose in ('registration','subscription','event','donation')),
  amount int not null check (amount > 0),
  method text not null check (method in ('mpesa','airtel','mixx','gepg','bank')),
  reference text not null,
  receipt_no text unique,
  created_at timestamptz not null default now(),
  unique (method, reference)
);
create index payments_member_idx on payments (member_id);

create table announcements (
  id text primary key,
  slug text unique,
  title text not null,
  body text not null,
  audience text not null check (audience in ('all','members','leadership')),
  created_at timestamptz not null default now(),
  author text not null,
  image text,
  link jsonb
);

create table enquiries (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','handled'))
);

create table resources (
  id text primary key,
  title text not null,
  kind text not null,
  description text not null,
  members_only boolean not null default false,
  url text not null,
  year int,
  author text,
  closes_at text
);

create table gallery (
  id text primary key,
  title text not null,
  date text not null,
  place text,
  link text,
  photos text[] not null default '{}'
);

create table tickets (
  id text primary key,
  member_id text not null references members(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

create table subscribers (
  id text primary key,
  email text not null,
  phone text,
  name text,
  sms_consent boolean not null default false,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  check (not sms_consent or phone is not null)
);
create unique index subscribers_email_key on subscribers (lower(email));

create table notifications (
  id text primary key,
  member_id text not null references members(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'general' check (kind in ('payment','event','general')),
  created_at timestamptz not null default now(),
  read boolean not null default false
);
create index notifications_member_idx on notifications (member_id, read);

create table messages (
  id text primary key,
  at timestamptz not null default now(),
  sender text not null,
  kind text not null check (kind in ('bulk','auto-reminder','event','newsletter')),
  audience text not null,
  channels text[] not null,
  subject text,
  body text not null,
  recipients int not null,
  sent int not null,
  failed int not null,
  sms_segments int not null default 0,
  provider text not null
);

create table audit (
  id text primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null
);
create index audit_at_idx on audit (at desc);

create table team (
  slug text primary key,
  name text not null,
  role text not null,
  "group" text not null check ("group" in ('executive','committee')),
  photo text not null,
  linkedin text,
  note text,
  position int not null default 0
);

create table partners (
  id text primary key,
  name text not null,
  logo text not null,
  url text,
  position int not null default 0
);

create table calendar (
  id text primary key,
  title text not null,
  date text not null,
  end_date text,
  kind text not null check (kind in ('deadline','meeting','training','holiday','other')),
  notes text,
  href text,
  members_only boolean not null default false
);

create table settings (
  id text primary key default 'site',
  tagline text not null,
  address text not null,
  phone text not null,
  email text not null,
  hero_slides jsonb not null default '[]',
  page_heroes jsonb not null default '{}',
  page_hero_focus jsonb not null default '{}'
);

-- One-time sign-in codes (hashed) with expiry and attempt counting.
create table login_codes (
  id text primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index login_codes_email_idx on login_codes (lower(email), created_at desc);

-- Sliding-window rate limiting shared across serverless instances.
create table rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index rate_limits_key_idx on rate_limits (key, at desc);

-- Atomic counters
create function next_member_no() returns bigint language sql as $$ select nextval('member_no_seq') $$;
create function next_receipt_no() returns bigint language sql as $$ select nextval('receipt_seq') $$;
create function set_sequence(seq text, val bigint) returns void language plpgsql as $$
begin perform setval(seq, greatest(val, 1), val >= 1); end $$;

-- Lock everything down: deny-all RLS, no direct API access for anon or authenticated roles.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on function next_member_no(), next_receipt_no(), set_sequence(text, bigint) from public, anon, authenticated;
revoke all on sequence member_no_seq, receipt_seq from anon, authenticated;
grant execute on function next_member_no(), next_receipt_no(), set_sequence(text, bigint) to service_role;
