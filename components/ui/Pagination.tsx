import Link from "next/link"

import { cn } from "@/lib/utils"

interface PaginationProps {
  className?: string
  page: number
  pageSize: number
  prefetch?: boolean
  query?: Record<string, number | string | undefined>
  total: number
}

const paginationLinkClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"

function getPageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  )
}

function buildPageHref(
  page: number,
  query?: Record<string, number | string | undefined>,
) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  }

  searchParams.set("page", String(page))
  return `?${searchParams.toString()}`
}

export function Pagination({
  className,
  page,
  pageSize,
  prefetch,
  query,
  total,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) {
    return null
  }

  const pages = getPageWindow(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-8 flex flex-wrap items-center justify-center gap-2", className)}
    >
      {page > 1 && (
        <Link
          className={paginationLinkClass}
          href={buildPageHref(page - 1, query)}
          prefetch={prefetch}
        >
          Previous
        </Link>
      )}

      {pages.map((pageNumber) => (
        <Link
          aria-current={pageNumber === page ? "page" : undefined}
          aria-label={`Page ${pageNumber}`}
          className={cn(
            paginationLinkClass,
            pageNumber === page &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
          href={buildPageHref(pageNumber, query)}
          key={pageNumber}
          prefetch={prefetch}
        >
          {pageNumber}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          className={paginationLinkClass}
          href={buildPageHref(page + 1, query)}
          prefetch={prefetch}
        >
          Next
        </Link>
      )}
    </nav>
  )
}
