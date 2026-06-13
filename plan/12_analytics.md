# 12 — Internal Analytics

## 1. Overview

Analytics is handled inside the app. The goal is to show useful blog analytics
in the admin panel without relying on a hosted analytics API and without slowing
down navigation.

Tracking is first-party, lightweight, and anonymous:

- No raw IP addresses are stored.
- Logged-in admin, writer, and revoked-user traffic is excluded.
- Private/auth/admin paths are ignored.
- Tracking failures are silent for visitors.
- Admin views read daily aggregate tables, not raw event scans.

Traffic-source/referrer analytics and technical breakdowns such as device,
browser, and country are intentionally out of scope.

---

## 2. Architecture

```
Visitor changes route
        │
        ▼
InternalAnalyticsTracker fires after render
        │
        ▼
trackEvent() sends POST /api/analytics/events
        │        via sendBeacon or keepalive fetch
        ▼
Route handler excludes private/logged-in traffic
        │
        ▼
lib/internalAnalytics.ts stores event + updates daily aggregates
        │
        ▼
Admin /admin and /admin/analytics read aggregate summaries
```

The tracker must never be awaited by UI flows. It is background telemetry only.

---

## 3. Data Model

Prisma models:

- `AnalyticsEvent`
  - Raw recent event records for audit/debugging and future backfills.
  - Stores event type, path, post slug, optional search query, anonymous visitor
    hash, anonymous session hash, optional duration, and timestamp.

- `AnalyticsDailySummary`
  - One row per day.
  - Stores pageviews, approximate visitors, approximate sessions, reads,
    comments, newsletter signups, searches, and total read seconds.

- `AnalyticsDailyPage`
  - One row per day/path.
  - Stores pageviews, reads, comments, optional post slug, and last viewed time.

- `AnalyticsDailyVisitor`
  - One row per day/visitor hash.
  - Used to increment daily unique visitor counts without storing raw IP.

- `AnalyticsDailySession`
  - One row per day/session hash.
  - Used to increment approximate visit/session counts.

Hashing uses `ANALYTICS_HASH_SALT` when present, otherwise the existing auth
secret fallback.

---

## 4. Tracked Events

Event names sent by `trackEvent()`:

- `page_view`
- `post_read`
- `comment_submitted`
- `newsletter_subscribed`
- `search`

The post read event fires after the read threshold in `PostReadTracker` and
includes `durationSeconds: 30`.

---

## 5. Admin Analytics

The admin dashboard and `/admin/analytics` show:

- Total pageviews
- Approximate unique visitors
- Approximate visits/sessions
- Read count
- Average read engagement time
- Comment events
- Newsletter signups
- Searches
- Top pages/posts by views
- Read rate for top pages

The widget must fall back gracefully if analytics data is unavailable.

---

## 6. Implementation Checklist

- [x] Add analytics Prisma models and migration.
- [x] Add `lib/internalAnalytics.ts`.
- [x] Add `POST /api/analytics/events`.
- [x] Update `lib/analytics.ts` to use first-party background tracking.
- [x] Add `components/analytics/InternalAnalyticsTracker.tsx`.
- [x] Add tracker to `app/layout.tsx`.
- [x] Track post reads, comment submissions, newsletter signups, and searches.
- [x] Update `AnalyticsWidget` and `/admin/analytics` to read internal stats.
- [x] Remove external analytics script/API dependency.

---

## 7. Verification

Run:

```bash
npm test -- tests/unit/analytics.test.tsx tests/unit/admin-analytics.test.tsx tests/unit/prisma-schema.test.ts tests/integration/analytics.test.ts
npm test
npm run typecheck
npm run build
```

Production follow-up:

- Apply the analytics migration to production.
- Redeploy Vercel.
- Confirm pageviews appear in `/admin/analytics` after visiting public pages.
