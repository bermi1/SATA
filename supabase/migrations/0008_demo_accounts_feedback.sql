-- View-only demo accounts for reviewers, and the feedback they leave.
alter table members add column if not exists demo boolean not null default false;
create table if not exists feedback (
  id text primary key,
  page text not null default '',
  message text not null,
  name text not null default '',
  role text not null default '',
  member_id text,
  status text not null default 'new' check (status in ('new','done')),
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;
