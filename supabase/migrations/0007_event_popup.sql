-- An event can be promoted as a pop-up shown to visitors when they open the website.
alter table events add column if not exists popup boolean not null default false;
alter table events add column if not exists popup_until timestamptz;
