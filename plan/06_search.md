# 06 — Full-Text Search

## 1. Overview

Search is powered by **PostgreSQL's built-in full-text search** via `tsvector` and `tsquery`. No external search service (Elasticsearch, Algolia, etc.) is needed. The search vector is automatically maintained by a database trigger defined in `01_database_schema.md`.

Search covers three fields with different weights:
- **Title** — Weight A (highest relevance)
- **Excerpt** — Weight B
- **Body text** (`contentText`) — Weight C (lowest relevance)

Only **published** posts are searchable.

---

## 2. Search Flow

```
User types in the SearchBar
        │
        ▼
Debounce 300ms (avoid firing on every keystroke)
        │
        ▼
GET /api/search?q=query&page=1
        │
        ▼
Server: sanitize query → build tsquery → run ranked search
        │
        ▼
Return: matched posts with highlighted excerpts + pagination
        │
        ▼
SearchBar renders results in a dropdown (instant)
OR
/search?q=query renders full results page (on Enter / "See all results")
```

---

## 3. API Route

### GET /api/search

```typescript
// app/api/search/route.ts
import { prisma } from '@/lib/prisma'
import { buildSearchQuery, highlightSnippet } from '@/lib/search'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(1).max(200).trim(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(20).default(10),
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  try {
    const { q, page, limit } = querySchema.parse(
      Object.fromEntries(searchParams)
    )

    const tsQuery = buildSearchQuery(q)

    // Use Prisma $queryRaw for the full-text search query.
    // Prisma's standard query API does not support tsvector operations,
    // so raw SQL is necessary here.
    const offset = (page - 1) * limit

    const [results, countResult] = await Promise.all([
      prisma.$queryRaw<SearchResult[]>`
        SELECT
          p.id,
          p.title,
          p.slug,
          p.excerpt,
          p."coverUrl",
          p."publishedAt",
          u.name        AS "authorName",
          u.username    AS "authorUsername",
          u."avatarUrl" AS "authorAvatarUrl",
          ts_rank(p.search_vector, to_tsquery('simple', ${tsQuery})) AS rank,
          ts_headline(
            'simple',
            COALESCE(p."contentText", ''),
            to_tsquery('simple', ${tsQuery}),
            'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
          ) AS snippet
        FROM posts p
        JOIN users u ON u.id = p."authorId"
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
        ORDER BY rank DESC, p."publishedAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,

      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) AS count
        FROM posts p
        WHERE
          p.status = 'PUBLISHED'
          AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
      `,
    ])

    const total = Number(countResult[0]?.count ?? 0)

    return Response.json({
      data: {
        results,
        query: q,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    // Return empty results instead of 500 for malformed queries
    if (error instanceof z.ZodError) {
      return Response.json(
        { data: { results: [], query: '', pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } }
      )
    }
    console.error('[GET /api/search]', error)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
```

---

## 4. Search Helper Library

```typescript
// lib/search.ts

/**
 * Convert a raw user query string into a safe PostgreSQL tsquery expression.
 *
 * Strategy:
 * - Split on whitespace
 * - Remove characters that are special in tsquery syntax: & | ! ( ) : *
 * - Join tokens with & (AND) so all terms must appear
 * - Append :* to the last token to support prefix matching
 *   (e.g. "ufota" will match "ufotable")
 *
 * Examples:
 *   "ufotable animation" → "ufotable & animation:*"
 *   "vinland saga ost"   → "vinland & saga & ost:*"
 *   "frieren!!"          → "frieren:*"
 */
export function buildSearchQuery(raw: string): string {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[&|!():*]/g, '').trim())
    .filter(Boolean)

  if (tokens.length === 0) return ''

  // All tokens except the last are exact matches (AND)
  // The last token gets :* for prefix matching (supports partial typing)
  const parts = tokens.map((token, i) =>
    i === tokens.length - 1 ? `${token}:*` : token
  )

  return parts.join(' & ')
}

/**
 * Type for a single search result row returned from $queryRaw.
 */
export interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  publishedAt: Date
  authorName: string
  authorUsername: string
  authorAvatarUrl: string | null
  rank: number
  snippet: string   // HTML string with <mark> tags for matched terms
}
```

---

## 5. SearchBar Component

The search bar provides two experiences:
- **Inline dropdown** — shows up to 5 results as the user types (debounced)
- **Full results page** — navigates to `/search?q=...` when the user presses Enter or clicks "See all results"

```typescript
// components/search/SearchBar.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import type { SearchResult } from '@/lib/search'

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch inline results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setResults(json.data?.results ?? [])
          setOpen(true)
        }
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="Search posts..."
          className="w-full pl-9 pr-8 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <button onClick={handleClear} className="absolute right-3 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-md shadow-lg overflow-hidden">
          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No results for "{debouncedQuery}"
            </p>
          )}

          {results.map((result) => (
            <Link
              key={result.id}
              href={`/${result.slug}`}
              onClick={() => { setOpen(false); setQuery('') }}
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
            >
              {result.coverUrl && (
                <img
                  src={result.coverUrl}
                  alt=""
                  className="w-12 h-8 object-cover rounded shrink-0 mt-0.5"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{result.title}</p>
                <p className="text-xs text-muted-foreground truncate">{result.authorName}</p>
              </div>
            </Link>
          ))}

          {results.length > 0 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-xs text-center text-primary hover:bg-muted transition-colors border-t font-medium"
            >
              See all results for "{query}"
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 6. useDebounce Hook

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
```

---

## 7. Full Search Results Page

```typescript
// app/(public)/search/page.tsx
import { prisma } from '@/lib/prisma'
import { buildSearchQuery } from '@/lib/search'
import { PostCard } from '@/components/posts/PostCard'
import { Pagination } from '@/components/ui/Pagination'
import type { SearchResult } from '@/lib/search'

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

const PAGE_SIZE = 10

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const query = (q ?? '').trim()
  const page = Number(pageParam ?? 1)

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <p className="text-muted-foreground">Enter a search term to find posts.</p>
      </div>
    )
  }

  const tsQuery = buildSearchQuery(query)
  const offset = (page - 1) * PAGE_SIZE

  const [results, countResult] = await Promise.all([
    prisma.$queryRaw<SearchResult[]>`
      SELECT
        p.id, p.title, p.slug, p.excerpt, p."coverUrl", p."coverAlt",
        p."publishedAt",
        u.name AS "authorName", u.username AS "authorUsername", u."avatarUrl" AS "authorAvatarUrl",
        ts_rank(p.search_vector, to_tsquery('simple', ${tsQuery})) AS rank,
        ts_headline(
          'simple',
          COALESCE(p."contentText", ''),
          to_tsquery('simple', ${tsQuery}),
          'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
        ) AS snippet
      FROM posts p
      JOIN users u ON u.id = p."authorId"
      WHERE p.status = 'PUBLISHED'
        AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
      ORDER BY rank DESC, p."publishedAt" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count FROM posts p
      WHERE p.status = 'PUBLISHED'
        AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
    `,
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">
        Search results for "{query}"
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        {total} result{total !== 1 ? 's' : ''} found
      </p>

      {results.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No posts matched your search.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try fewer or different keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}

// Compact card variant for search results — shows snippet with highlighted terms
function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="border rounded-lg p-5 hover:shadow-sm transition-shadow">
      <div className="flex gap-4">
        {result.coverUrl && (
          <img
            src={result.coverUrl}
            alt=""
            className="w-24 h-16 object-cover rounded shrink-0"
          />
        )}
        <div className="min-w-0">
          <a href={`/${result.slug}`} className="font-semibold hover:text-primary transition-colors line-clamp-2">
            {result.title}
          </a>
          <p className="text-xs text-muted-foreground mt-0.5">
            {result.authorName}
          </p>
          {/* Render snippet with <mark> tags for highlighted matches */}
          {result.snippet && (
            <p
              className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-0.5 [&_mark]:rounded"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          )}
        </div>
      </div>
    </article>
  )
}
```

> **Note on `dangerouslySetInnerHTML`:** The snippet HTML comes from PostgreSQL's `ts_headline` function — it only inserts `<mark>` tags around matched terms. The content itself is plain text stored in `contentText` (no user-authored HTML). This is safe, but if you want to be extra cautious, sanitize the output with `DOMPurify` on the client side.

---

## 8. Keeping contentText in Sync

`Post.contentText` must always be kept in sync with the Tiptap editor content. This plain text is what gets indexed by the PostgreSQL trigger.

**When saving a post** (in `PostEditor`), the `onChange` callback from `TiptapEditor` returns both the JSON content and the plain text:

```typescript
// In PostEditor (see 04_posts.md)
<TiptapEditor
  content={content}
  onChange={(json, text) => {
    setContent(json)
    setContentText(text)   // ← this gets sent to the API as contentText
  }}
  editable
/>
```

**In the API route** (`POST /api/posts` and `PATCH /api/posts/[id]`), `contentText` is saved alongside `content`. The PostgreSQL trigger then automatically updates `search_vector` from this value.

---

## 9. Pagination Component

Reusable pagination component used across the homepage, search page, and tag/category pages.

```typescript
// components/ui/Pagination.tsx
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  // Optional: base URL path. Defaults to current path.
  // Pagination uses searchParams: ?page=N
}

export function Pagination({ page, total, pageSize }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Show at most 5 page numbers centered around current page
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const delta = 2
  const left = Math.max(1, page - delta)
  const right = Math.min(totalPages, page + delta)
  const pages = range(left, right)

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={`?page=${page - 1}`}
        aria-disabled={!hasPrev}
        className={`p-2 rounded-md border transition-colors ${
          hasPrev
            ? 'hover:bg-muted'
            : 'opacity-40 pointer-events-none'
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {left > 1 && (
        <>
          <Link href="?page=1" className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted">1</Link>
          {left > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={`?page=${p}`}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            p === page
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted'
          }`}
        >
          {p}
        </Link>
      ))}

      {right < totalPages && (
        <>
          {right < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link href={`?page=${totalPages}`} className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted">
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={`?page=${page + 1}`}
        aria-disabled={!hasNext}
        className={`p-2 rounded-md border transition-colors ${
          hasNext
            ? 'hover:bg-muted'
            : 'opacity-40 pointer-events-none'
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  )
}
```

---

## 10. Checklist

- [ ] Confirm the `posts_search_vector_trigger` is active (from `01_database_schema.md`)
- [ ] Create `lib/search.ts` with `buildSearchQuery` and `SearchResult` type
- [ ] Create `hooks/useDebounce.ts`
- [ ] Create `app/api/search/route.ts`
- [ ] Create `components/search/SearchBar.tsx`
- [ ] Create `app/(public)/search/page.tsx`
- [ ] Create `components/ui/Pagination.tsx`
- [ ] Add `SearchBar` to `Navbar` component (see `08_ui_components.md`)
- [ ] Verify: searching "frieren" returns posts containing "Frieren" in title/body
- [ ] Verify: partial query "ufota" returns posts containing "ufotable" (prefix matching)
- [ ] Verify: searching an empty string returns a 400 / empty result, not a 500
- [ ] Verify: `<mark>` tags are rendered visually highlighted in the snippet
- [ ] Verify: draft posts do not appear in search results
- [ ] Verify: `contentText` is saved when a post is created or updated, and `search_vector` is updated by the trigger (check with raw SQL: `SELECT title, search_vector FROM posts LIMIT 1;`)
