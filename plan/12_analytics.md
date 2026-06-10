# 12 — Analytics (Umami)

## 1. Overview

Analytics is handled by **Umami** — an open-source, privacy-friendly, self-hosted analytics platform. It tracks page views, unique visitors, referrers, and top pages without using cookies or collecting personal data.

Umami is deployed as a separate service on **Railway** (free tier is sufficient). It communicates with the Next.js app via a single `<script>` tag injected into the root layout. The admin views analytics inside the Umami dashboard (separate URL), and a summary widget is embedded in the admin panel.

---

## 2. Architecture

```
Visitor loads any page
        │
        ▼
Umami tracking script fires (async, non-blocking)
        │
        ▼
POST https://umami.yourdomain.com/api/send
        │
        ▼
Umami stores event in its own PostgreSQL DB (on Railway)
        │
        ▼
Admin opens /admin or umami.yourdomain.com
        └── Views dashboard: pageviews, visitors, top posts, referrers
```

---

## 3. Umami Setup on Railway

These steps are done once manually before writing any application code.

### Step 1 — Deploy Umami on Railway

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Search for `umami-software/umami` or use the Railway template: https://railway.app/template/umami
3. Railway auto-provisions a PostgreSQL database for Umami
4. Set the required environment variables in Railway:

```env
DATABASE_URL=        # Auto-filled by Railway PostgreSQL plugin
HASH_SALT=           # Any random string: openssl rand -hex 16
```

5. Deploy → Railway gives you a public URL: `https://umami-production-xxxx.up.railway.app`
6. Log in with default credentials: `admin` / `umami` → **change immediately**
7. Add a new Website in Umami settings → Name: "Anime Blog", Domain: `yourdomain.com`
8. Copy the **Website ID** — needed for the tracking script

### Step 2 — Add environment variables to the Next.js app

```env
# .env.local
NEXT_PUBLIC_UMAMI_SCRIPT_URL="https://umami-production-xxxx.up.railway.app/script.js"
NEXT_PUBLIC_UMAMI_WEBSITE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## 4. Tracking Script Integration

Add the Umami script to the root layout. It must be loaded with `strategy="afterInteractive"` so it does not block rendering.

```typescript
// app/layout.tsx  (add to existing layout)
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        {/* ... existing layout content ... */}

        {/* Umami analytics — only load in production */}
        {process.env.NODE_ENV === 'production' && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
```

This single script handles all page view tracking automatically, including client-side navigation in Next.js App Router.

---

## 5. What Umami Tracks (out of the box)

No additional configuration needed for these:

| Metric | Description |
|---|---|
| Page views | Total views per page, per day/week/month |
| Unique visitors | Based on anonymized fingerprint, no cookies |
| Visit duration | Average time spent per session |
| Bounce rate | % of sessions with only 1 page view |
| Referrers | Where visitors came from (Google, Twitter, direct) |
| Browsers | Chrome, Firefox, Safari breakdown |
| Devices | Desktop, mobile, tablet |
| Countries | Visitor country based on IP (anonymized) |
| Top pages | Ranked list of most-viewed pages |

---

## 6. Custom Event Tracking

Beyond automatic page views, track meaningful user actions using Umami's custom events API.

```typescript
// lib/analytics.ts

/**
 * Track a custom event with Umami.
 * Safe to call on server or client — on server it's a no-op.
 * Falls back silently if Umami script is not loaded.
 */
export function trackEvent(eventName: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return
  if (!(window as any).umami) return

  ;(window as any).umami.track(eventName, data)
}
```

### Events to track

```typescript
// When a post is read (fire after 30 seconds on the page — indicates genuine read)
trackEvent('post_read', { slug: post.slug, title: post.title })

// When a comment is submitted successfully
trackEvent('comment_submitted', { postSlug: post.slug })

// When newsletter form is submitted successfully
trackEvent('newsletter_subscribed')

// When search is performed (on Enter / full results page load)
trackEvent('search', { query: searchQuery })
```

### Where to fire these events

```typescript
// components/comments/CommentForm.tsx
// After successful comment submission:
import { trackEvent } from '@/lib/analytics'
// ...
onSuccess(json.data)
trackEvent('comment_submitted', { postSlug: currentSlug })

// components/newsletter/NewsletterForm.tsx
// After successful subscription:
trackEvent('newsletter_subscribed')

// app/(public)/search/page.tsx
// On page load with a query:
// This is a Server Component, so use a Client Component wrapper for the event:
// <SearchPageTracker query={query} />
```

### Post read tracker (client component)

```typescript
// components/posts/PostReadTracker.tsx
'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface PostReadTrackerProps {
  slug: string
  title: string
}

export function PostReadTracker({ slug, title }: PostReadTrackerProps) {
  useEffect(() => {
    // Fire after 30 seconds — a reasonable proxy for "actually read"
    const timer = setTimeout(() => {
      trackEvent('post_read', { slug, title })
    }, 30_000)

    return () => clearTimeout(timer)
  }, [slug, title])

  // Renders nothing — purely for side effects
  return null
}
```

Add to the post detail page:

```typescript
// app/(public)/[slug]/page.tsx
import { PostReadTracker } from '@/components/posts/PostReadTracker'

// Inside the page component return:
<>
  <PostReadTracker slug={post.slug} title={post.title} />
  <article>
    {/* ... post content ... */}
  </article>
</>
```

---

## 7. Admin Panel Integration

The admin panel shows a compact analytics summary widget on the `/admin` dashboard page. It fetches data from Umami's API.

### Umami API Authentication

```env
# .env.local  (server-only — no NEXT_PUBLIC_ prefix)
UMAMI_API_URL="https://umami-production-xxxx.up.railway.app"
UMAMI_USERNAME="admin"
UMAMI_PASSWORD="your-umami-password"
UMAMI_WEBSITE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Umami API Helper

```typescript
// lib/umami.ts

const UMAMI_API_URL = process.env.UMAMI_API_URL!
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID!

/**
 * Get a short-lived Umami API token.
 * Umami uses username/password auth returning a bearer token.
 */
async function getUmamiToken(): Promise<string> {
  const res = await fetch(`${UMAMI_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.UMAMI_USERNAME,
      password: process.env.UMAMI_PASSWORD,
    }),
    // Cache the token for 1 hour
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error('Umami auth failed')
  const { token } = await res.json()
  return token
}

export interface UmamiStats {
  pageviews: { value: number; prev: number }
  visitors: { value: number; prev: number }
  visits: { value: number; prev: number }
  bounces: { value: number; prev: number }
  totalTime: { value: number; prev: number }
}

export interface UmamiTopPage {
  x: string   // page path
  y: number   // view count
}

/**
 * Fetch site-wide stats for a given time range.
 * startAt / endAt: Unix timestamps in milliseconds
 */
export async function getUmamiStats(
  startAt: number,
  endAt: number
): Promise<UmamiStats> {
  const token = await getUmamiToken()

  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
  })

  const res = await fetch(
    `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/stats?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },  // Cache for 5 minutes
    }
  )

  if (!res.ok) throw new Error('Failed to fetch Umami stats')
  return res.json()
}

/**
 * Fetch top pages ranked by view count.
 */
export async function getUmamiTopPages(
  startAt: number,
  endAt: number,
  limit = 10
): Promise<UmamiTopPage[]> {
  const token = await getUmamiToken()

  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    type: 'url',
    limit: String(limit),
  })

  const res = await fetch(
    `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/metrics?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    }
  )

  if (!res.ok) throw new Error('Failed to fetch Umami top pages')
  return res.json()
}
```

### Analytics Widget Component

```typescript
// components/admin/AnalyticsWidget.tsx
import { getUmamiStats, getUmamiTopPages } from '@/lib/umami'
import { TrendingUp, Users, Eye, MousePointerClick } from 'lucide-react'

// Time range helpers
function last30Days() {
  const endAt = Date.now()
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000
  return { startAt, endAt }
}

function percentChange(current: number, prev: number): string {
  if (prev === 0) return '+0%'
  const change = ((current - prev) / prev) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`
}

export async function AnalyticsWidget() {
  const { startAt, endAt } = last30Days()

  let stats = null
  let topPages: { x: string; y: number }[] = []

  try {
    ;[stats, topPages] = await Promise.all([
      getUmamiStats(startAt, endAt),
      getUmamiTopPages(startAt, endAt, 5),
    ])
  } catch {
    // Umami may be temporarily unavailable — fail gracefully
    return (
      <div className="p-4 border rounded-lg text-sm text-muted-foreground">
        Analytics data unavailable.
      </div>
    )
  }

  const metrics = [
    {
      label: 'Page views',
      value: stats.pageviews.value.toLocaleString(),
      change: percentChange(stats.pageviews.value, stats.pageviews.prev),
      icon: Eye,
    },
    {
      label: 'Unique visitors',
      value: stats.visitors.value.toLocaleString(),
      change: percentChange(stats.visitors.value, stats.visitors.prev),
      icon: Users,
    },
    {
      label: 'Visits',
      value: stats.visits.value.toLocaleString(),
      change: percentChange(stats.visits.value, stats.visits.prev),
      icon: MousePointerClick,
    },
    {
      label: 'Avg. time on site',
      value: `${Math.round(stats.totalTime.value / stats.visits.value)}s`,
      change: percentChange(stats.totalTime.value, stats.totalTime.prev),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <span className="text-xs text-muted-foreground">Last 30 days</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(({ label, value, change, icon: Icon }) => {
          const isPositive = change.startsWith('+')
          return (
            <div key={label} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon size={14} className="text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className={`text-xs mt-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {change} vs prev period
              </p>
            </div>
          )
        })}
      </div>

      {/* Top pages */}
      {topPages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Top pages (last 30 days)</h3>
          <div className="space-y-2">
            {topPages.map((page) => (
              <div key={page.x} className="flex items-center justify-between text-sm">
                <a
                  href={page.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[400px]"
                >
                  {page.x}
                </a>
                <span className="font-medium shrink-0 ml-4">
                  {page.y.toLocaleString()} views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to full Umami dashboard */}
      <a
        href={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.replace('/script.js', '')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        View full analytics dashboard →
      </a>
    </div>
  )
}
```

Add `AnalyticsWidget` to the admin dashboard page:

```typescript
// app/(admin)/admin/page.tsx  (update existing file)
import { AnalyticsWidget } from '@/components/admin/AnalyticsWidget'
import { Suspense } from 'react'

export default async function AdminDashboardPage() {
  // ... existing stat counts ...

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {/* ... existing stat grid ... */}
      </div>

      {/* Analytics — wrapped in Suspense so slow Umami API doesn't block page */}
      <Suspense fallback={
        <div className="p-4 border rounded-lg text-sm text-muted-foreground animate-pulse">
          Loading analytics...
        </div>
      }>
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
```

---

## 8. Per-Post View Count (lightweight)

For showing a view count on each post page, there are two options:

**Option A — Use Umami API** (recommended): fetch the view count for a specific page path from Umami when rendering the post detail page server-side. No extra DB column needed.

**Option B — Self-tracked in DB**: increment a `viewCount` integer column on the `Post` table via an API call on each page load. Simpler but adds write load to the main DB.

**Use Option A** — Umami already has the data. Add a helper:

```typescript
// lib/umami.ts  (add to existing file)

/**
 * Get view count for a specific page path.
 * Returns 0 if Umami is unavailable.
 */
export async function getPostViewCount(slug: string): Promise<number> {
  try {
    const { startAt, endAt } = {
      startAt: 0,               // From the beginning of time
      endAt: Date.now(),
    }
    const token = await getUmamiToken()
    const params = new URLSearchParams({
      startAt: String(startAt),
      endAt: String(endAt),
      type: 'url',
      limit: '1',
      query: `/${slug}`,        // Filter by exact post path
    })

    const res = await fetch(
      `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/metrics?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 600 } }
    )

    if (!res.ok) return 0
    const data: { x: string; y: number }[] = await res.json()
    return data.find((d) => d.x === `/${slug}`)?.y ?? 0
  } catch {
    return 0
  }
}
```

---

## 9. Checklist

- [ ] Deploy Umami on Railway using the Railway template
- [ ] Change default Umami admin credentials immediately after deploy
- [ ] Create a website entry in Umami for the blog domain
- [ ] Copy Website ID from Umami settings
- [ ] Add `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` to `.env.local`
- [ ] Add `UMAMI_API_URL`, `UMAMI_USERNAME`, `UMAMI_PASSWORD`, `UMAMI_WEBSITE_ID` to `.env.local`
- [ ] Add Umami `<Script>` to `app/layout.tsx` (production only)
- [ ] Create `lib/analytics.ts` with `trackEvent` helper
- [ ] Create `lib/umami.ts` with `getUmamiStats`, `getUmamiTopPages`, `getPostViewCount`
- [ ] Create `components/posts/PostReadTracker.tsx` and add to post detail page
- [ ] Add `trackEvent` calls to `CommentForm`, `NewsletterForm`
- [ ] Create `components/admin/AnalyticsWidget.tsx`
- [ ] Add `AnalyticsWidget` to `/admin` page wrapped in `<Suspense>`
- [ ] Add Umami env variables to Vercel project settings (production)
- [ ] Verify: opening any page fires a page view in Umami's realtime view
- [ ] Verify: `AnalyticsWidget` shows correct page view count
- [ ] Verify: analytics script is NOT loaded in development (`NODE_ENV !== 'production'`)
- [ ] Verify: if Umami is down, the admin dashboard still loads (graceful fallback)
