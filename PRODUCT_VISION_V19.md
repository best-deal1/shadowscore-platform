# ShadowScore V19 Product Vision & Development Strategy

## Mission

Build ShadowScore into the world's leading Trust Intelligence platform for digital businesses.

ShadowScore does not promise business success, guarantee account approval, guarantee reinstatement or prevent every suspension. ShadowScore helps users understand, explain and reduce business risk before it becomes a problem.

**Know Your Risk Before They Do™**

## Core Product Principles

### Evidence Driven

Every score must be explainable and backed by observable evidence. Reports should clearly answer:

- Why was this score generated?
- Which evidence was used?
- Which providers contributed?
- What can the user improve?

### Explainable Intelligence

Users should trust the explanation more than the score. The score is only the summary; the evidence is the product.

### Versioned Risk Engine

Every generated report must permanently store:

- Risk engine version
- Provider versions
- Timestamp
- Evidence snapshot
- Report version
- Score explanation

Reports should remain reproducible after future engine and provider changes.

## Architecture Strategy

ShadowScore should be built around independent provider modules. Providers may include SSL, DNS, WHOIS, security headers, SPF, DMARC, marketplace signals, payment signals, compliance signals, reputation signals and future AI providers.

New providers should be plug-and-play without changing the core engine. Platform-specific enforcement signals, such as marketplace notice codes, belong inside provider modules rather than the core architecture.

## Workspace Strategy

Each user owns a permanent workspace. The workspace should store reports, scan history, watchlist entries, purchased reports, payment history, legal acceptances and profile settings. No user information should be lost after logout.

New users must always see:

- Zero reports
- Empty watchlist
- Empty timeline
- Start first scan

Demo data must never appear in production workspaces.

## Authentication and Database Strategy

Demo authentication and LocalStorage persistence should be replaced with production-ready authentication and a real backend. Recommended foundation:

- Supabase Auth or equivalent secure authentication
- PostgreSQL as the durable source of truth
- Password hashing handled by the auth provider
- Secure session management
- Password reset
- Email verification
- Future role-based access control

## Scan and Report Gating

The free scan is a preview only. It may display preliminary risk level and basic findings, but must not reveal the full risk score, detailed breakdown, recommendations, evidence, provider results or action plan.

Paid reports unlock the full risk score, confidence, score explanation, risk breakdown, recommendations, evidence checklist, provider results and dashboard history.

## Payment Workflow

The payment workflow is:

1. Free scan
2. Checkout
3. Legal acceptance
4. Payment
5. Generate report
6. Store report
7. Dashboard

Checkout must never create a completed report. Checkout should create only a payment intent until payment succeeds.

## Long-Term Platform Direction

ShadowScore is the commercial product. Atlas is future infrastructure. Do not build Atlas first.

Reusable ShadowScore components, including authentication, providers, payments, risk engine, workspace, monitoring and APIs, should be designed so they can later become part of Atlas. Build the product first and extract the platform later.

## Engineering Rules

- Production-ready code only
- Strong typing
- Clean architecture
- Modular providers
- Mobile-first UI
- No demo data in production
- Build must pass before every commit
- Every release should improve architecture, not only UI
