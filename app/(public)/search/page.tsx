import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { SearchPageTracker } from "@/components/search/SearchPageTracker"
import { Pagination } from "@/components/ui/Pagination"
import { getCachedSearchResults } from "@/lib/queries"
import {
  buildSearchQuery,
  sanitizeSearchSnippet,
  type SearchResult,
} from "@/lib/search"
import { buildMetadata } from "@/lib/seo"
import { formatDate } from "@/lib/utils"

interface SearchPageProps {
  searchParams: Promise<{ page?: string; q?: string }>
}

const PAGE_SIZE = 10

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = (q ?? "").trim()

  return buildMetadata({
    canonicalPath: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
    noIndex: true,
    title: query ? `Search: ${query}` : "Search",
  })
}

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="rounded-[8px] border border-dashed p-8 text-center">
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
    <article className="border-t py-5 first:border-t-0">
      <div className="flex gap-4">
        {result.coverUrl && (
          <img
            alt=""
            className="hidden h-24 w-32 shrink-0 rounded-[6px] object-cover sm:block"
            decoding="async"
            loading="lazy"
            src={result.coverUrl}
          />
        )}
        <div className="min-w-0 flex-1">
          <Link
            className="text-lg font-semibold leading-snug tracking-tight transition-colors hover:text-editorial"
            href={`/${result.slug}`}
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
      <PageContainer className="py-10">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Search</h1>
        <div className="mt-8">
          <EmptySearchState query={query} />
        </div>
      </PageContainer>
    )
  }

  const { results, total } = await getCachedSearchResults(
    tsQuery,
    page,
    PAGE_SIZE,
  )

  return (
    <PageContainer className="py-10">
      <SearchPageTracker query={query} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-editorial">
        Search archive
      </p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">
        Results for &quot;{query}&quot;
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {total} result{total === 1 ? "" : "s"} found
      </p>

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptySearchState query={query} />
        ) : (
          <div>
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
    </PageContainer>
  )
}
