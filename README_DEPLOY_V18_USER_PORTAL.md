# ShadowScore V18 - User Portal, Saved Reports & Risk Workspace

This version upgrades ShadowScore from a one-time scan flow into the first version of a user workspace.

## Added

- `/dashboard` user portal route
- Local user identity placeholder
- Saved report history
- Saved entities / watchlist
- Risk timeline
- Dashboard stats
- Legal acceptance records surfaced in the dashboard
- Checkout-created report intents saved into report history
- Dashboard link in navigation
- Homepage CTA to dashboard
- Social links moved into the homepage footer as well as internal layout footer
- Metadata updated toward Trust & Risk Intelligence Platform positioning

## Important

V18 uses localStorage for demo persistence:

- `shadowscoreReports`
- `shadowscoreEntities`
- `shadowscoreLegalAcceptances`
- `shadowscoreUserEmail`

This is production-safe for a front-end MVP, but V19 should connect the model to real authentication and a database.

Recommended backend for V19:

- Supabase Auth + Postgres
- Firebase Auth + Firestore
- Auth0 + Postgres
- Clerk + Supabase

## Production Push

```bash
git add .
git commit -m "V18 user portal, dashboard, saved reports and watchlist"
git push origin main
```
