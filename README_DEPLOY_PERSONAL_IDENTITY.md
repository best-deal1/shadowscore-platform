# Personal identity deployment

Personal identity investigations ship behind fail-closed readiness controls. Existing website, email, marketplace, evidence, checkout, and historical report paths remain active while this feature is disabled.

## Canonical resources

- Migration: `supabase/migrations/20260824010000_personal_identity_intake.sql`
- Private storage bucket: `identity-evidence`

## Deploy and activate

1. Deploy the application with `NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED` and `PERSONAL_IDENTITY_ENABLED` unset or `false`.
2. Apply `20260824010000_personal_identity_intake.sql` to the production Supabase project.
3. Confirm that `public.intakes.identity_signals` exists and has the JSON default defined by the migration.
4. Confirm that the `identity-evidence` bucket exists, remains private, allows only JPG, PNG, and WebP content, and enforces the 10MB limit.
5. Test the insert, select, and delete policies with two authenticated test users. Each user must access only objects whose first path segment matches their own user ID.
6. Set `IDENTITY_MIGRATION_APPLIED=true`, `IDENTITY_EVIDENCE_BUCKET_READY=true`, and `IDENTITY_STORAGE_POLICIES_VERIFIED=true` only after those checks pass.
7. Set `NEXT_PUBLIC_PERSONAL_IDENTITY_ENABLED=true` and `PERSONAL_IDENTITY_ENABLED=true` to expose the intake and allow the server workflow. Redeploy, then complete email-only, phone-only, name-only, username-only, combined-signal, upload, checkout, and report smoke tests.
8. To stop new personal identity investigations, set `PERSONAL_IDENTITY_ENABLED=false` and redeploy. Existing product workflows continue normally.

The migration has not been applied by this repository change. A production operator must apply and verify it before activation.
