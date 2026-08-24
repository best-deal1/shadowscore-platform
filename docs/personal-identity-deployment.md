# Personal identity production rollout

Production migration status: **not verified or applied by this change**. Repository access does not prove the state of the production Supabase project.

## Required database and storage change

Apply `supabase/migrations/20260824000000_personal_identity_intake_and_storage.sql`. It adds the nullable `public.intakes.identity_signals` JSONB column, creates the private `identity-evidence` bucket, and installs owner-scoped select, insert, and delete policies.

The nullable column preserves existing business investigations and legacy email records. The application feature gate remains closed unless all four readiness environment variables explicitly confirm the rollout.

## Deployment steps

1. Leave `PERSONAL_IDENTITY_WORKFLOW_ENABLED=false` in production.
2. Link the Supabase CLI to the production project: `supabase link --project-ref <production-project-ref>`.
3. Review pending changes: `supabase migration list` and `supabase db diff --linked`.
4. Apply migrations: `supabase db push --linked`.
5. Verify the column: `select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'intakes' and column_name = 'identity_signals';`.
6. Verify the private bucket: `select id, public, file_size_limit from storage.buckets where id = 'identity-evidence';`.
7. Verify its policies: `select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'identity evidence owner %';`.
8. Test upload, read, and delete with a staging authenticated user. Confirm a second user cannot access the object.
9. Set `PERSONAL_IDENTITY_SCHEMA_READY=true`, `PERSONAL_IDENTITY_STORAGE_READY=true`, and `PERSONAL_IDENTITY_STORAGE_POLICIES_READY=true`.
10. Set `PERSONAL_IDENTITY_WORKFLOW_ENABLED=true`, deploy, and run a personal identity smoke test before routing production traffic.
11. Roll back safely by setting `PERSONAL_IDENTITY_WORKFLOW_ENABLED=false`. Keep the nullable column and private bucket in place so stored records remain readable.
