# changes/01_performance.md — Performance Improvements

## Problem

Pages feel slow to respond. Common causes in a Next.js 14 + Supabase stack:

1. **Unoptimized DB queries** — fetching too many fields, missing indexes, N+1 queries
2. **No caching** — every request hits the DB cold
3. **Large images** — uncompressed GIFs/cover images slow initial load
4. **No loading states** — user sees blank page while data loads, feels slower than it is
5. **Blocking data fetches** — sequential awaits instead of parallel `Promise.all`

---

## Follow-up Finding — 2026-06-12

Local testing showed the original checklist was too generic. This project's
local `DATABASE_URL` uses the Supabase PgBouncer endpoint with
`connection_limit=1`, so blindly parallelizing Prisma work can queue or time out
queries instead of making them faster.

Applied follow-up fixes:

- Development-only Prisma URL normalization widens `connection_limit=1` to
  `connection_limit=5` without changing `.env.local` or production behavior.
- Anonymous public visitors no longer call `/api/auth/session` from the navbar.
- Contributors are cached with `unstable_cache`.
- Post `generateStaticParams` is skipped outside production so `next dev` does
  not query recent slugs during local route handling.
- `npm run dev` enables Watchpack polling to avoid local Linux `ENOSPC` watcher
  failures.

Measured after follow-up on local dev server:

- Before follow-up: `/contributors` repeated at ~720ms warm and had cold
  requests around 9.2s; logs showed Prisma pool timeouts with
  `connection_limit=1`.
- After follow-up: warm `/contributors` is ~53-58ms, warm post detail is
  ~104-167ms, warm `/search` is ~51-58ms, and warm homepage is ~132-319ms.
- Remaining cold delays after server restart are mostly Next dev compilation:
  for example `/` logged 2.5s in Next and 726ms in application code.

## Fix 1 — Parallel data fetching

Any page that awaits multiple DB queries must use `Promise.all`. Sequential awaits are the most common performance killer.

**Files to change:** all Server Component pages in `app/(public)/`

```typescript
// ❌ Before — sequential, slow
const post = await prisma.post.findUnique(...)
const comments = await prisma.comment.findMany(...)
const related = await prisma.post.findMany(...)

// ✅ After — parallel, fast
const [post, comments, related] = await Promise.all([
  prisma.post.findUnique(...),
  prisma.comment.findMany(...),
  prisma.post.findMany(...),
])
```

Apply this pattern to every page that makes more than one DB call:
- `app/(public)/page.tsx` — posts + categories + recentPosts
- `app/(public)/[slug]/page.tsx` — post + comments
- `app/(public)/authors/[username]/page.tsx` — author + posts + count
- `app/(admin)/admin/page.tsx` — all stat counts

---

## Fix 2 — Next.js caching on DB queries

Next.js 14 App Router has built-in fetch caching, but Prisma queries bypass it by default. Use `unstable_cache` to cache expensive queries.

**Files to change:** `lib/queries.ts` (create this file)

```typescript
// lib/queries.ts
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Cache homepage post list for 60 seconds
// Revalidated when a post is published/updated via revalidateTag
export const getCachedPublishedPosts = unstable_cache(
  async (page: number, limit: number) => {
    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverUrl: true,
          coverAlt: true,
          publishedAt: true,
          author: { select: { name: true, username: true, avatarUrl: true } },
          coAuthors: {
            include: { user: { select: { name: true, username: true } } },
            orderBy: { order: 'asc' },
          },
          category: { select: { name: true, slug: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
    ])
    return { posts, total }
  },
  ['published-posts'],
  { revalidate: 60, tags: ['posts'] }
)

// Cache sidebar data for 5 minutes — changes rarely
export const getCachedSidebarData = unstable_cache(
  async () => {
    const [categories, recentPosts] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: true,
          _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
        },
      }),
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { title: true, slug: true, publishedAt: true },
      }),
    ])
    return { categories, recentPosts }
  },
  ['sidebar-data'],
  { revalidate: 300, tags: ['posts', 'categories'] }
)

// Cache individual post for 5 minutes
export const getCachedPost = unstable_cache(
  async (slug: string) => {
    return prisma.post.findUnique({
      where: { slug, status: 'PUBLISHED' },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, bio: true } },
        coAuthors: {
          include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
          orderBy: { order: 'asc' },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    })
  },
  ['post'],
  { revalidate: 300, tags: ['posts'] }
)
```

### Invalidate cache when content changes

When a post is published, updated, or deleted, call `revalidateTag` to bust the cache immediately:

```typescript
// app/api/posts/route.ts and app/api/posts/[id]/route.ts
import { revalidateTag } from 'next/cache'

// After creating or updating a post:
revalidateTag('posts')

// After updating a category:
revalidateTag('categories')
```

---

## Fix 3 — Select only needed fields

Never use `include` with full relations when you only need a few fields. Always use `select` to limit what Prisma fetches from the DB.

**Files to change:** any API route or page that uses `include` broadly

```typescript
// ❌ Fetches everything including bio, role, createdAt, updatedAt...
author: { include: { User: true } }

// ✅ Only fetch what the UI actually displays
author: {
  select: { name: true, username: true, avatarUrl: true }
}
```

Audit every Prisma query in the codebase and replace any bare `include` with explicit `select`.

---

## Fix 4 — Add missing DB indexes

The full-text search index is already set up, but check these additional indexes are present in `prisma/schema.prisma`:

```prisma
model Post {
  // These should already exist — verify:
  @@index([status, publishedAt(sort: Desc)])  // homepage listing
  @@index([authorId])                          // author profile page
  @@index([categoryId])                        // category listing
  @@index([slug])                              // post detail lookup
}

model Comment {
  @@index([postId, status])   // loading comments for a post
  @@index([parentId])         // loading replies
}

model Tag {
  @@index([slug])
}

model NewsletterSubscriber {
  @@index([email])
  @@index([token])
  @@index([status])   // add this if missing — used in broadcast query
}
```

If any are missing, add them to `schema.prisma` and run:
```bash
npx prisma migrate dev --name add_missing_indexes
```

---

## Fix 5 — Image optimization

GIFs and large images slow down page load significantly. Apply these:

### Cover images in PostCard and PostHeader

Add `loading="lazy"` to all images that are not above the fold:

```typescript
// PostCard.tsx — cover image
<img
  src={post.coverUrl}
  alt={post.coverAlt ?? post.title}
  loading="lazy"           // ← add this
  decoding="async"         // ← add this
  className="w-full h-full object-cover ..."
/>

// PostHeader.tsx — cover image is above the fold, use eager loading
<img
  src={post.coverUrl}
  loading="eager"
  fetchPriority="high"     // ← tells browser to prioritize this image
  className="w-full h-full object-cover"
/>
```

### R2 upload: enforce size limits

Already implemented in `app/api/upload/route.ts` (10MB max). Consider reducing to 5MB for non-GIF images to improve load times:

```typescript
// app/api/upload/route.ts
const MAX_BYTES_IMAGE = 5 * 1024 * 1024   // 5MB for JPG/PNG/WebP
const MAX_BYTES_GIF   = 10 * 1024 * 1024  // 10MB for GIF (animation needs more)

const maxBytes = file.type === 'image/gif' ? MAX_BYTES_GIF : MAX_BYTES_IMAGE
if (file.size > maxBytes) {
  return Response.json({
    error: `File must be ${file.type === 'image/gif' ? '10' : '5'}MB or smaller`
  }, { status: 400 })
}
```

---

## Fix 6 — Loading states with Suspense

Wrap slow data-fetching sections in `<Suspense>` so the page shell renders immediately while data loads. This makes the page feel faster even if total load time is the same.

**Files to change:** `app/(public)/page.tsx`, `app/(public)/[slug]/page.tsx`

```typescript
// app/(public)/page.tsx
import { Suspense } from 'react'
import { PostListSkeleton } from '@/components/posts/PostListSkeleton'

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PostListSkeleton />}>
            <PostListAsync page={Number(searchParams.page ?? 1)} />
          </Suspense>
        </main>
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarAsync />
        </Suspense>
      </div>
    </div>
  )
}

// Async component that fetches its own data
async function PostListAsync({ page }: { page: number }) {
  const { posts, total } = await getCachedPublishedPosts(page, 10)
  return <PostList posts={posts} pagination={{ page, total, pageSize: 10 }} />
}

async function SidebarAsync() {
  const { categories, recentPosts } = await getCachedSidebarData()
  return <Sidebar categories={categories} recentPosts={recentPosts} />
}
```

### PostListSkeleton

```typescript
// components/posts/PostListSkeleton.tsx
export function PostListSkeleton() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="w-full aspect-video rounded-lg bg-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <aside className="w-full lg:w-60 xl:w-72 shrink-0 space-y-8 animate-pulse">
      <div className="h-24 bg-muted rounded-lg" />
      <div className="h-40 bg-muted rounded-lg" />
    </aside>
  )
}
```

---

## Fix 7 — generateStaticParams for post pages

Pre-render the most recent 20 posts at build time so they are served instantly as static HTML:

```typescript
// app/(public)/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: { slug: true },
  })
  return posts.map((post) => ({ slug: post.slug }))
}

// Allow new posts to be rendered on-demand and cached
export const revalidate = 300  // revalidate every 5 minutes
```

---

## Checklist

- [x] Apply `Promise.all` to all pages with multiple DB queries
- [x] Create `lib/queries.ts` with `unstable_cache` wrappers for homepage, sidebar, post detail
- [x] Add `revalidateTag('posts')` calls in post create/update/delete API routes
- [x] Audit all Prisma queries — replace bare `include` with explicit `select`
- [x] Verify all required indexes exist in schema — run migration if any are missing
- [x] Add `loading="lazy"` to all non-above-fold images, `fetchPriority="high"` to cover image in PostHeader
- [x] Apply differentiated size limits in upload route (5MB images, 10MB GIFs)
- [x] Add `<Suspense>` wrappers with skeleton fallbacks to homepage and post list
- [x] Create `PostListSkeleton` and `SidebarSkeleton` components
- [x] Add `generateStaticParams` to post detail page
- [x] Add development-only Prisma pool widening for local Supabase PgBouncer URLs
- [x] Cache contributors page data
- [x] Skip post static slug generation during `next dev`
- [x] Avoid anonymous navbar `/api/auth/session` requests
- [x] Enable Watchpack polling in `npm run dev` to avoid Linux watcher limits
- [x] Measure before and after: use Chrome DevTools Network tab, check Time to First Byte (TTFB) and Largest Contentful Paint (LCP)

Measurement note, 2026-06-12: no reliable pre-change baseline was captured
before this phase. Current production-server measurements via Playwright:
homepage TTFB 200ms / LCP 5252ms, prerendered post TTFB 6ms / LCP 768ms.

Follow-up local dev measurements, 2026-06-12: after restarting with
`WATCHPACK_POLLING=true`, cold route requests still include Next dev compilation
cost, but warm public route responses are under ~320ms in the measured paths.
