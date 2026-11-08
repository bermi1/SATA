-- Automatically collected anaesthesia news (see lib/news-feed.ts and /api/cron/news).
-- Kept small: the job keeps only the newest items, so it never grows past a few hundred rows.
create table if not exists news_feed (
  id text primary key,            -- hash of the article URL
  title text not null,
  summary text not null default '',
  url text not null,
  image text,
  source text not null,
  region text not null check (region in ('tanzania','africa','world')),
  category text not null check (category in ('conference','research','case','safety','news')),
  score real not null default 0,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now()
);
create index if not exists news_feed_published_idx on news_feed (published_at desc);
alter table news_feed enable row level security;
