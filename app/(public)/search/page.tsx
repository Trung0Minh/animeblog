import Link from "next/link"

import { Pagination } from "@/components/ui/Pagination"
import { prisma } from "@/lib/prisma"
import {
  buildSearchQuery,
  sanitizeSearchSnippet,
  type SearchResult,
} from "@/lib/search"
import { formatDate } from "@/lib/utils"

interface SearchPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

const PAGE_SIZE = 10

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {query
          ? "No posts matched your search. Try fewer or different keywords."
          : "Enter a search term to find posts."}
      </p>
    </div>
  )
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const snippet = sanitizeSearchSnippet(result.snippet)

  return (
    <article className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5">
      <div className="flex gap-4">
        {result.coverUrl && (
          <img
            alt=""
            className="hidden h-24 w-32 shrink-0 rounded-xl object-cover sm:block"
            src={result.coverUrl}
          />
        )}
        <div className="min-w-0 flex-1">
          <Link
            className="text-lg font-semibold tracking-tight transition-colors hover:text-editorial"
            href={`/${result.slug}`}
            prefetch={false}
          >
            {result.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.authorName} · {formatDate(result.publishedAt)}
          </p>
          {snippet && (
            <p
              className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground [&_mark]:rounded [&_mark]:bg-editorial/20 [&_mark]:px-0.5 [&_mark]:text-foreground"
              dangerouslySetInnerHTML={{ __html: snippet }}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { page: pageParam, q } = await searchParams
  const query = (q ?? "").trim()
  const page = parsePage(pageParam)
  const tsQuery = buildSearchQuery(query)

  if (!query || !tsQuery) {
    return (
      <main className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <div className="mt-8">
          <EmptySearchState query={query} />
        </div>
      </main>
    )
  }

  const offset = (page - 1) * PAGE_SIZE
  const [results, countResult] = await Promise.all([
    prisma.$queryRaw<SearchResult[]>`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p."coverUrl",
        p."publishedAt",
        u.name AS "authorName",
        u.username AS "authorUsername",
        u."avatarUrl" AS "authorAvatarUrl",
        ts_rank(p.search_vector, to_tsquery('simple', ${tsQuery})) AS rank,
        ts_headline(
          'simple',
          COALESCE(p."contentText", ''),
          to_tsquery('simple', ${tsQuery}),
          'MaxWords=34, MinWords=12, StartSel=<mark>, StopSel=</mark>, HighlightAll=false'
        ) AS snippet
      FROM posts p
      JOIN users u ON u.id = p."authorId"
      WHERE
        p.status = 'PUBLISHED'
        AND p.search_vector @@ to_tsquery('simple', ${tsQuery})
      ORDER BY rank DESC, p."publishedAt" DESC
      LIMIT ${PAGE_SIZE}
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

  return (
    <main className="container max-w-4xl py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Search archive
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Results for &quot;{query}&quot;
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {total} result{total === 1 ? "" : "s"} found
      </p>

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptySearchState query={query} />
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        query={{ q: query }}
        total={total}
      />
    </main>
  )
}
