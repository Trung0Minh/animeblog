import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable"
import { Pagination } from "@/components/ui/Pagination"
import { getCachedAdminComments } from "@/lib/queries"

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

  const { comments, total } = await getCachedAdminComments(page, PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hide approved comments that should no longer appear publicly.
        </p>
      </div>

      <AdminCommentsTable comments={comments} />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        prefetch={false}
        total={total}
      />
    </div>
  )
}
