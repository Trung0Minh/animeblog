# Remaining Tasks Handoff

Last updated: 2026-06-13

This file tracks the remaining unchecked work from `plan/tasks.md` and the
current blockers.

## Invite Flow

Completed:

- `3.12` Verify end-to-end: send invite from admin, receive email, create
  account, login, reach `/dashboard`
- `17.3` Test full invite flow end-to-end in production environment

Evidence:

- User manually verified invite delivery and new writer login successfully.

## Analytics

Completed:

- Phase 13 uses internal analytics.
- The app does not require an external analytics service for admin analytics.
- `ANALYTICS_HASH_SALT` is optional; the app falls back to the existing auth
  secret for anonymous visitor/session hashing.

Current implementation:

- Pageviews are tracked by `InternalAnalyticsTracker`.
- Engagement events are sent by `trackEvent()` using `sendBeacon` with a
  keepalive `fetch` fallback.
- `POST /api/analytics/events` excludes private/admin/writer traffic and stores
  only anonymous hashes, not raw IP addresses.
- Admin analytics reads daily aggregate tables through `lib/internalAnalytics.ts`.

## Remaining Unchecked Tasks

From the canonical `plan/tasks.md`, the remaining unchecked items are:

- `1.9` Create `.env.local` from `.env.example` and fill in actual values.
  Local `.env.local` exists, but the tracker item remains unchecked.
- `17.10` Add all env variables to Vercel project settings.
  Core env vars have been configured during deployment work, but the tracker
  item remains unchecked until a final Vercel env audit is completed.

## Production Follow-Up

- Apply the new internal analytics migration to production before expecting
  analytics events to store successfully.
- Redeploy Vercel after the migration/code changes.
- Optional: set `ANALYTICS_HASH_SALT` in local and Vercel environments. If left
  blank, hashing still works through the existing auth secret fallback.
