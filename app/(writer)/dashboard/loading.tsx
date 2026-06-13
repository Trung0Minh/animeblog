export default function DashboardLoading() {
  return (
    <main
      aria-live="polite"
      className="container max-w-4xl py-8 sm:py-10"
      role="status"
    >
      <span className="sr-only">Loading dashboard</span>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
        </div>
        <div className="h-10 w-24 rounded-md bg-muted" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="rounded-xl border p-4" key={index}>
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  )
}
