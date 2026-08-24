alter table public.intakes
  add column if not exists identity_signals jsonb not null default '{"emails":[],"phones":[],"names":[],"usernames":[],"referenceImages":[]}'::jsonb;

-- Replacing the constraint is safe for every value accepted by earlier releases.
alter table public.intakes drop constraint if exists intakes_scan_mode_check;
alter table public.intakes add constraint intakes_scan_mode_check
  check (scan_mode in ('website', 'marketplace', 'evidence', 'personal')) not valid;
alter table public.intakes validate constraint intakes_scan_mode_check;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-evidence', 'identity-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "identity evidence owner insert" on storage.objects;
drop policy if exists "identity evidence owner select" on storage.objects;
drop policy if exists "identity evidence owner delete" on storage.objects;

create policy "identity evidence owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "identity evidence owner select" on storage.objects for select to authenticated
using (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "identity evidence owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
