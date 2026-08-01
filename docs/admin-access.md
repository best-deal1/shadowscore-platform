# Administrator report access

Administrator access is based on the authenticated Supabase user and `public.profiles.role`. The application does not use an email allowlist or a browser flag.

Run this SQL in the Supabase SQL Editor after applying the administrator access migration:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where lower(email) = lower('nir@012.net.il');
```

Confirm that exactly one profile was updated:

```sql
select id, email, role
from public.profiles
where lower(email) = lower('nir@012.net.il');
```

To remove administrator access, set the role back to `user` from the SQL Editor. Profile role changes from authenticated application sessions are rejected by a database trigger.
