"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Loader2, Search, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/useDebounce"
import type { SearchResult } from "@/lib/search"

interface SearchResponse {
  data?: {
    results?: SearchResult[]
  }
}

export function SearchBar() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim()

    if (!trimmedQuery) {
      return
    }

    let isCancelled = false

    async function loadResults() {
      setIsLoading(true)

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}&limit=5`,
        )
        const payload = (await response.json()) as SearchResponse

        if (isCancelled) return

        setResults(payload.data?.results ?? [])
        setIsOpen(true)
      } catch {
        if (!isCancelled) {
          setResults([])
          setIsOpen(true)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadResults()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  function navigateToSearch() {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setIsOpen(false)
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      navigateToSearch()
    }

    if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  function clearSearch() {
    setIsOpen(false)
    setQuery("")
    setResults([])
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="group relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-accent"
        />
        <input
          aria-label="Tìm kiếm bài viết"
          className="h-8 w-full rounded-full border border-transparent bg-subtle-bg pl-9 pr-9 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-border-default focus:bg-background"
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)

            if (!nextQuery.trim()) {
              setIsOpen(false)
              setResults([])
            }
          }}
          onFocus={() => {
            if (results.length > 0 || query.trim()) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm bài viết..."
          type="search"
          value={query}
        />
        {isLoading ? (
          <Loader2
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : query ? (
          <Button
            aria-label="Xóa tìm kiếm"
            className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-text-tertiary hover:text-text-primary"
            onClick={clearSearch}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[8px] border border-border-default bg-background shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
          {results.length === 0 && !isLoading && (
            <p className="px-4 py-3 text-sm text-text-secondary">
              Không có kết quả cho &quot;{debouncedQuery.trim()}&quot;
            </p>
          )}

          {results.map((result) => (
            <Link
              aria-label={result.title}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-subtle-bg"
              href={`/${result.slug}`}
              key={result.id}
              onClick={clearSearch}
            >
              {result.coverUrl && (
                <img
                  alt=""
                  className="mt-0.5 h-10 w-14 shrink-0 rounded-[4px] object-cover"
                  decoding="async"
                  loading="lazy"
                  src={result.coverUrl}
                />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {result.title}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  {result.authorName}
                </span>
              </span>
            </Link>
          ))}

          {results.length > 0 && (
            <Link
              className="block border-t border-border-default px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-subtle-bg"
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
            >
              Xem tất cả kết quả cho &quot;{query.trim()}&quot;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
