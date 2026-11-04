-- Private bucket for posters, photos and PDFs. Files are read and written only by the server (service role)
-- and served through /api/uploads/[name]; there are no public storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 20971520, array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
