import type { PostStatus } from "@prisma/client"
import Link from "next/link"

import { AdminPostsTable } from "@/components/admin/AdminPostsTable"
import { Pagination } from "@/components/ui/Pagination"
import { getCachedAdminPosts } from "@/lib/queries"
import { cn } from "@/lib/utils"

interface AdminPostsPageProps {
  searchParams: Promise<{ page?: string; status?: string }>
}

const PAGE_SIZE = 20
const STATUS_FILTERS: Array<{ href: string; label: string; status?: PostStatus }> = [
  { href: "/admin/posts", label: "All" },
  { href: "/admin/posts?status=PUBLISHED", label: "Published", status: "PUBLISHED" },
  { href: "/admin/posts?status=DRAFT", label: "Drafts", status: "DRAFT" },
  { href: "/admin/posts?status=ARCHIVED", label: "Archived", status: "ARCHIVED" },
]

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

function parseStatus(value?: string): PostStatus | undefined {
  return value === "PUBLISHED" || value === "DRAFT" || value === "ARCHIVED"
    ? value
    : undefined
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const { page: pageParam, status: statusParam } = await searchParams
  const page = parsePage(pageParam)
  const status = parseStatus(statusParam)

  const { posts, total } = await getCachedAdminPosts(page, status, PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and remove published posts or drafts from any writer.
          </p>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-[8px] border bg-background p-1">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.status === status || (!filter.status && !status)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-[5px] px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
                href={filter.href}
                key={filter.href}
                prefetch={false}
              >
                {filter.label}
              </Link>
            )
          })}
        </div>
      </div>

      <AdminPostsTable posts={posts} />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        prefetch={false}
        query={{ status }}
        total={total}
      />
    </div>
  )
}
