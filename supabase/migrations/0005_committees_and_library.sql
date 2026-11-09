-- Committee roles and the members-only resource library with Education committee review.
alter table members drop constraint if exists members_role_check;
alter table members add constraint members_role_check check (role in ('member','secretariat','management','treasurer','education','social','leadership'));
alter table resources add column if not exists status text not null default 'published' check (status in ('pending','published','rejected'));
alter table resources add column if not exists submitted_by text;
alter table resources add column if not exists submitted_at timestamptz;
alter table resources add column if not exists reviewed_by text;
alter table resources add column if not exists review_note text;
update resources set kind = case when kind = 'policy' then 'guideline' when kind in ('guideline','form','research','case','article') then kind else 'article' end;
update resources set members_only = true where kind <> 'form';
