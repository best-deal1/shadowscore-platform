-- Personal identity intake and private evidence storage.
-- Apply this migration before enabling PERSONAL_IDENTITY_WORKFLOW_ENABLED.
alter table public.intakes
  add column if not exists identity_signals jsonb;

alter table public.intakes
  drop constraint if exists intakes_identity_signals_object;
alter table public.intakes
  add constraint intakes_identity_signals_object
  check (identity_signals is null or jsonb_typeof(identity_signals) = 'object');

insert into storage.buckets (id, name, public, file_size_limit)
values ('identity-evidence', 'identity-evidence', false, 15728640)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

-- Object names must start with the authenticated user's UUID.
drop policy if exists "identity evidence owner read" on storage.objects;
create policy "identity evidence owner read" on storage.objects for select to authenticated
using (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "identity evidence owner insert" on storage.objects;
create policy "identity evidence owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "identity evidence owner delete" on storage.objects;
create policy "identity evidence owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'identity-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
