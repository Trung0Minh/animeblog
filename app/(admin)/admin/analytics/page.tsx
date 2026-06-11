import { Suspense } from "react"
import { ExternalLink } from "lucide-react"

import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import { Button } from "@/components/ui/button"

function getDashboardUrl() {
  return process.env.UMAMI_API_URL?.replace(/\/+$/, "") ?? ""
}

export default async function AdminAnalyticsPage() {
  const dashboardUrl = getDashboardUrl()

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-editorial">
          Audience
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review traffic, readers, and top pages from the Umami deployment.
              The embedded summary stays lightweight so the admin panel remains
              usable if analytics is unavailable.
            </p>
          </div>
          {dashboardUrl && (
            <Button asChild>
              <a href={dashboardUrl} rel="noreferrer" target="_blank">
                Open Umami dashboard
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </section>

      <Suspense
        fallback={
          <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
            Loading analytics...
          </div>
        }
      >
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
