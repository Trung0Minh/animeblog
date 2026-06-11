import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable"
import { Pagination } from "@/components/ui/Pagination"
import { prisma } from "@/lib/prisma"

interface AdminCommentsPageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 30

function parsePage(value?: string) {
  const page = Number.parseInt(value ?? "1", 10)

  return Number.isFinite(page) && page > 0 ? page : 1
}

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const where = { status: "APPROVED" as const }

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        authorName: true,
        content: true,
        createdAt: true,
        id: true,
        post: { select: { slug: true, title: true } },
        status: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    prisma.comment.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hide approved comments that should no longer appear publicly.
        </p>
      </div>

      <AdminCommentsTable comments={comments} />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  )
}
