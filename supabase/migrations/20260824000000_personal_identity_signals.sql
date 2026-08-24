-- Backward-compatible structured provenance for optional personal identity intake signals.
alter table public.intakes
  add column if not exists identity_signals jsonb not null default '{}'::jsonb;

alter table public.intakes
  add constraint intakes_identity_signals_object
  check (jsonb_typeof(identity_signals) = 'object') not valid;

comment on column public.intakes.identity_signals is
  'User-submitted identity references with explicit user_submitted_* provenance. These values are not independent public evidence.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-references', 'identity-references', false, 15728640, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "identity reference owners can upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'identity-references' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "identity reference owners can read"
on storage.objects for select to authenticated
using (bucket_id = 'identity-references' and (storage.foldername(name))[1] = auth.uid()::text);
