-- Extra answers from the membership application form (personal details, payment proof, declaration).
alter table members add column if not exists application jsonb;
