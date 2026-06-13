import { Suspense } from "react"

import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[8px] border bg-background p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-editorial">
          Audience
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review traffic, readers, and top pages from analytics stored
              directly in this site. Tracking runs in the background and the
              admin panel reads daily aggregates instead of blocking on visitor
              events.
            </p>
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="rounded-[8px] border p-5 text-sm text-muted-foreground">
            Loading analytics...
          </div>
        }
      >
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
