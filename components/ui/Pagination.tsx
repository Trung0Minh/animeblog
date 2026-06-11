import Link from "next/link"

import { cn } from "@/lib/utils"

interface PaginationProps {
  className?: string
  page: number
  pageSize: number
  total: number
}

function getPageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  )
}

export function Pagination({ className, page, pageSize, total }: PaginationProps) {
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
          className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
          href={`?page=${page - 1}`}
        >
          Previous
        </Link>
      )}

      {pages.map((pageNumber) => (
        <Link
          aria-current={pageNumber === page ? "page" : undefined}
          aria-label={`Page ${pageNumber}`}
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted",
            pageNumber === page &&
              "border-primary bg-primary text-primary-foreground hover:bg-primary",
          )}
          href={`?page=${pageNumber}`}
          key={pageNumber}
        >
          {pageNumber}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
          href={`?page=${page + 1}`}
        >
          Next
        </Link>
      )}
    </nav>
  )
}
