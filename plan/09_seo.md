# 09 — SEO & Open Graph

## 1. Overview

Every public page must have proper meta tags, Open Graph tags, and Twitter Card tags so that links shared on social media (Facebook, Twitter/X, Discord) render with a rich preview card. Next.js 16 App Router handles this via the `generateMetadata` function and the `metadata` export on each page.

Key SEO targets:
- **Post detail pages** — unique title, description, cover image as OG image
- **Homepage** — blog name, default description
- **Category / Tag pages** — category/tag name in title
- **Author profile pages** — writer name in title
- **Sitemap** — auto-generated for Google indexing
- **robots.txt** — allow all crawlers on public pages, block dashboard/admin

---

## 2. Metadata Utility

Centralizes default values so every page has a consistent fallback.

```typescript
// lib/seo.ts
import type { Metadata } from 'next'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Anime Blog'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const DEFAULT_DESCRIPTION = 'In-depth anime analysis, reviews, and essays.'
// Fallback OG image — place a 1200×630 image at /public/og-default.png
const DEFAULT_OG_IMAGE = `${APP_URL}/og-default.png`

interface BuildMetadataOptions {
  title?: string
  description?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noIndex?: boolean        // true for draft previews, admin pages
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(APP_URL),

    openGraph: {
      title: fullTitle,
      description,
      url: APP_URL,
      siteName: APP_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type: ogType,
      locale: 'vi_VN',
    },

    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },

    ...(noIndex && {
      robots: { index: false, follow: false },
    }),
  }
}
```

---

## 3. Per-Page Metadata

### Root Layout (app/layout.tsx)

Already set in `08_ui_components.md`. Provides default title template:

```typescript
export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    siteName: APP_NAME,
    locale: 'vi_VN',
    type: 'website',
  },
}
```

### Post Detail Page

```typescript
// app/(public)/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    select: {
      title: true,
      excerpt: true,
      coverUrl: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  })

  if (!post) return buildMetadata({ noIndex: true })

  return buildMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    ogImage: post.coverUrl ?? undefined,
    ogType: 'article',
    // Next.js also supports article-specific OG fields:
    // openGraph.authors, openGraph.publishedTime, openGraph.tags
    // These must be added manually after calling buildMetadata:
  }) satisfies Metadata
}

// Full version with article-specific fields:
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug, status: 'PUBLISHED' },
    select: {
      title: true,
      excerpt: true,
      coverUrl: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  })

  if (!post) return buildMetadata({ noIndex: true })

  const base = buildMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    ogImage: post.coverUrl ?? undefined,
    ogType: 'article',
  })

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
      tags: post.tags.map((t) => t.tag.name),
    },
  }
}
```

### Category Page

```typescript
// app/(public)/category/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!category) return buildMetadata({ noIndex: true })

  return buildMetadata({
    title: category.name,
    description: category.description ?? `Posts in the ${category.name} category`,
  })
}
```

### Tag Page

```typescript
// app/(public)/tag/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { name: true },
  })

  if (!tag) return buildMetadata({ noIndex: true })

  return buildMetadata({
    title: `#${tag.name}`,
    description: `Posts tagged with ${tag.name}`,
  })
}
```

### Author Profile Page

```typescript
// app/(public)/authors/[username]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const author = await prisma.user.findUnique({
    where: { username },
    select: { name: true, bio: true, avatarUrl: true },
  })

  if (!author) return buildMetadata({ noIndex: true })

  return buildMetadata({
    title: author.name,
    description: author.bio ?? `Posts by ${author.name}`,
    ogImage: author.avatarUrl ?? undefined,
  })
}
```

### Search Page

```typescript
// app/(public)/search/page.tsx
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  const query = q ?? ''
  return buildMetadata({
    title: query ? `Search: ${query}` : 'Search',
    noIndex: true,   // Search pages should not be indexed
  })
}
```

### Dashboard and Admin Pages — No Index

```typescript
// Add to all (writer) and (admin) layouts:
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

---

## 4. Sitemap

Next.js 16 App Router generates sitemaps via a special `sitemap.ts` route file.

```typescript
// app/sitemap.ts
import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/contributors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  // All published posts
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  })

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${APP_URL}/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // All categories
  const categories = await prisma.category.findMany({
    select: { slug: true },
  })

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${APP_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // All tags
  const tags = await prisma.tag.findMany({
    select: { slug: true },
  })

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${APP_URL}/tag/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  // All author profiles
  const authors = await prisma.user.findMany({
    select: { username: true },
  })

  const authorPages: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${APP_URL}/authors/${author.username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...postPages,
    ...categoryPages,
    ...tagPages,
    ...authorPages,
  ]
}
```

The sitemap is automatically available at `/sitemap.xml`.

---

## 5. robots.txt

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/invite/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
```

Available at `/robots.txt`.

---

## 6. Canonical URLs

Add canonical tags to prevent duplicate content issues (e.g. pagination pages being indexed separately).

In `buildMetadata`, add:

```typescript
// lib/seo.ts — add to the returned metadata object
alternates: {
  canonical: APP_URL,   // Override per-page with the specific page URL
},
```

On paginated pages, pass the canonical URL explicitly:

```typescript
// app/(public)/page.tsx
export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)

  return {
    ...buildMetadata(),
    alternates: {
      // Only page 1 is canonical — paginated pages should not be indexed independently
      canonical: page === 1
        ? `${process.env.NEXT_PUBLIC_APP_URL}`
        : `${process.env.NEXT_PUBLIC_APP_URL}?page=${page}`,
    },
    ...(page > 1 && { robots: { index: false, follow: true } }),
  }
}
```

---

## 7. Structured Data (JSON-LD)

Add JSON-LD structured data to post detail pages for Google's rich results (article cards in search).

```typescript
// components/posts/PostJsonLd.tsx
interface PostJsonLdProps {
  title: string
  description: string | null
  coverUrl: string | null
  publishedAt: Date | null
  updatedAt: Date
  authorName: string
  slug: string
}

export function PostJsonLd({
  title,
  description,
  coverUrl,
  publishedAt,
  updatedAt,
  authorName,
  slug,
}: PostJsonLdProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Anime Blog'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description ?? undefined,
    image: coverUrl ?? undefined,
    datePublished: publishedAt?.toISOString(),
    dateModified: updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      url: APP_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${APP_URL}/${slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

Add `<PostJsonLd />` inside the post detail page, before the `<article>` tag:

```typescript
// app/(public)/[slug]/page.tsx
export default async function PostPage({ params }: Props) {
  // ...fetch post...

  return (
    <>
      <PostJsonLd
        title={post.title}
        description={post.excerpt}
        coverUrl={post.coverUrl}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
        authorName={post.author.name}
        slug={post.slug}
      />
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        {/* ...rest of page... */}
      </article>
    </>
  )
}
```

---

## 8. Default OG Image

Place a fallback OG image at `public/og-default.png`. Dimensions: **1200 × 630px**.

This image is used when a post has no cover image. It should include:
- Blog name / logo
- A distinctive background that looks good when shared on social media

This file must be created manually — the coding agent cannot generate images.

---

## 9. Checklist

- [ ] Create `lib/seo.ts` with `buildMetadata` helper
- [ ] Add `generateMetadata` to all public pages: `/`, `/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/authors/[username]`, `/search`, `/contributors`
- [ ] Add `robots: { index: false }` to all dashboard and admin pages/layouts
- [ ] Create `app/sitemap.ts`
- [ ] Create `app/robots.ts`
- [ ] Create `components/posts/PostJsonLd.tsx` and add to post detail page
- [ ] Add canonical URL handling for paginated homepage
- [ ] Place a `public/og-default.png` fallback image (1200×630px) — created manually
- [ ] Verify: share a post URL on Facebook / Twitter and confirm the preview card shows the correct title, description, and cover image (use https://opengraph.xyz or https://cards-dev.twitter.com/validator)
- [ ] Verify: `/sitemap.xml` is accessible and lists all published post URLs
- [ ] Verify: `/robots.txt` disallows `/dashboard/` and `/admin/`
- [ ] Verify: Google Search Console does not show dashboard/admin URLs in the index (after deploying)
