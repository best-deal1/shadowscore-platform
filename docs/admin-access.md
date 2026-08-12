# Administrator report access

Administrator access is based on the authenticated Supabase user and `public.profiles.role`. The application does not use an email allowlist or a browser flag.

Apply all Supabase migrations first. Then run this SQL in the production Supabase SQL Editor while signed in as a trusted project administrator. This operation is not exposed through the application or the public API:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id from auth.users
  where lower(email) = lower('nir@012.net.il')
);
```

Confirm that exactly one profile was updated:

```sql
select id, email, role
from public.profiles
where id = (
  select id from auth.users
  where lower(email) = lower('nir@012.net.il')
);
```

The update must affect exactly one row. Sign out and sign in again after the update. To remove administrator access, set the role back to `user` from the SQL Editor. Profile role changes from authenticated application sessions are rejected by a database trigger. Customers cannot insert or delete profiles through RLS, so they cannot replace their default `user` role.
