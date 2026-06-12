export function PostListSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading posts">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          className="overflow-hidden rounded-xl border bg-card"
          data-testid="post-card-skeleton"
          key={index}
        >
          <div className="aspect-video w-full animate-pulse bg-muted" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="hidden space-y-2 sm:block">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <aside
      aria-label="Loading sidebar"
      className="w-full shrink-0 space-y-8 lg:w-64 xl:w-80 2xl:w-96"
    >
      <div className="h-32 animate-pulse rounded-xl border bg-muted" />
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-28 animate-pulse rounded-xl border bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-xl border bg-muted" />
      </div>
    </aside>
  )
}
