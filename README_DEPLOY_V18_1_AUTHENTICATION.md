# ShadowScore V18.1 - Authentication & User Workspace

This release upgrades the V18 user portal into an authenticated workspace.

## Added

- `/signup` account creation page
- `/login` sign-in page
- `/account` account settings page
- Password-based authentication for the MVP
- Protected `/dashboard` route
- Sign out flow
- User ID, account creation time and last login display
- Terms and Privacy acceptance during sign up
- Navigation links for Login, Create Account and Dashboard

## Preserved

- Existing risk engine
- Existing intake flow
- Existing payment legal gate
- Existing Terms and Privacy pages
- Existing Example Report
- Existing Dashboard, Saved Reports, Watchlist and Risk Timeline
- Existing social footer

## Important Production Note

V18.1 uses browser localStorage for the MVP authentication layer so the product can demonstrate the full account flow immediately.

Before real customers and payments at scale, connect authentication and data persistence to a secure backend such as:

- Supabase Auth + Postgres
- Firebase Auth + Firestore
- Auth.js + database adapter
- Clerk + database
- Custom backend with secure sessions

Production must not rely on localStorage for real account security.

## Deployment

```bash
git add .
git commit -m "V18.1 authentication, login, signup and protected dashboard"
git push origin main
```
