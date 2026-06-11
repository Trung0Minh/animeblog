import Link from "next/link"
import {
  BarChart3,
  ExternalLink,
  Eye,
  MousePointerClick,
  Timer,
  Users,
} from "lucide-react"

import {
  getUmamiStats,
  getUmamiTopPages,
  type UmamiStats,
  type UmamiTopPage,
} from "@/lib/umami"
import { cn } from "@/lib/utils"

function last30Days() {
  const endAt = Date.now()
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000

  return { endAt, startAt }
}

function getDashboardUrl() {
  return process.env.UMAMI_API_URL?.replace(/\/+$/, "") ?? ""
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "0%" : "+100%"
  }

  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`
}

function formatDuration(totalSeconds: number, visits: number) {
  if (visits <= 0) {
    return "0s"
  }

  const seconds = Math.round(totalSeconds / visits)

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}m ${remainingSeconds}s`
}

export async function AnalyticsWidget() {
  const { endAt, startAt } = last30Days()
  let stats: UmamiStats
  let topPages: UmamiTopPage[]

  try {
    ;[stats, topPages] = await Promise.all([
      getUmamiStats(startAt, endAt),
      getUmamiTopPages(startAt, endAt, 5),
    ])
  } catch {
    return (
      <section className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        Analytics data unavailable.
      </section>
    )
  }

  const dashboardUrl = getDashboardUrl()
  const metrics = [
    {
      change: percentChange(stats.pageviews.value, stats.pageviews.prev),
      icon: Eye,
      label: "Page views",
      value: stats.pageviews.value.toLocaleString(),
    },
    {
      change: percentChange(stats.visitors.value, stats.visitors.prev),
      icon: Users,
      label: "Unique visitors",
      value: stats.visitors.value.toLocaleString(),
    },
    {
      change: percentChange(stats.visits.value, stats.visits.prev),
      icon: MousePointerClick,
      label: "Visits",
      value: stats.visits.value.toLocaleString(),
    },
    {
      change: percentChange(stats.totalTime.value, stats.totalTime.prev),
      icon: Timer,
      label: "Avg. time",
      value: formatDuration(stats.totalTime.value, stats.visits.value),
    },
  ]

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-editorial">
            Last 30 days
          </p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart3 aria-hidden="true" className="h-5 w-5 text-editorial" />
            Analytics
          </h2>
        </div>
        {dashboardUrl && (
          <a
            className="inline-flex items-center gap-1.5 text-sm font-medium text-editorial transition-colors hover:text-editorial/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={dashboardUrl}
            rel="noreferrer"
            target="_blank"
          >
            View full analytics dashboard
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ change, icon: Icon, label, value }) => {
          const isPositive = change.startsWith("+")
          const isFlat = change === "0%"

          return (
            <div className="rounded-2xl border bg-background/60 p-4" key={label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {label}
                </p>
                <Icon aria-hidden="true" className="h-4 w-4 text-editorial" />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  isFlat && "text-muted-foreground",
                  !isFlat &&
                    isPositive &&
                    "text-emerald-600 dark:text-emerald-400",
                  !isFlat && !isPositive && "text-destructive",
                )}
              >
                {change} vs previous period
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-2xl border bg-background/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Top pages</h3>
          <span className="text-xs text-muted-foreground">Ranked by views</span>
        </div>

        {topPages.length > 0 ? (
          <div className="mt-4 space-y-3">
            {topPages.map((page) => (
              <div
                className="flex items-center justify-between gap-4 text-sm"
                key={page.x}
              >
                <Link
                  className="min-w-0 truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={page.x}
                >
                  {page.x}
                </Link>
                <span className="shrink-0 font-semibold">
                  {page.y.toLocaleString()} views
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No page data yet.
          </p>
        )}
      </div>
    </section>
  )
}
