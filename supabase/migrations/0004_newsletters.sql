-- Weekly newsletter issues ("10 key things this week"). Drafted by /api/cron/newsletter, edited and sent from /admin/newsletter.
create table if not exists newsletters (
  id text primary key,
  week_of date not null,
  subject text not null,
  intro text not null default '',
  items jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_count int not null default 0,
  created_by text not null default 'system'
);
create index if not exists newsletters_week_idx on newsletters (week_of desc);
alter table newsletters enable row level security;
