import { Suspense } from "react"
import Link from "next/link"
import {
  FileText,
  Mail,
  MessageSquare,
  PenLine,
  Users,
} from "lucide-react"

import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import { Button } from "@/components/ui/button"
import { getCachedAdminDashboardStats } from "@/lib/queries"

const statCards = [
  {
    href: "/admin/posts?status=PUBLISHED",
    icon: FileText,
    key: "publishedPosts",
    label: "Published posts",
  },
  {
    href: "/admin/posts?status=DRAFT",
    icon: PenLine,
    key: "draftPosts",
    label: "Drafts",
  },
  {
    href: "/admin/writers",
    icon: Users,
    key: "writers",
    label: "Active writers",
  },
  {
    href: "/admin/comments",
    icon: MessageSquare,
    key: "approvedComments",
    label: "Approved comments",
  },
  {
    href: "/admin/newsletter",
    icon: Mail,
    key: "activeSubscribers",
    label: "Active subscribers",
  },
] as const

export default async function AdminDashboardPage() {
  const stats = await getCachedAdminDashboardStats()

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-editorial">
          Admin
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Publication control room
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review editorial activity, moderate comments, invite writers, and
              prepare broadcasts from one compact surface.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/writers" prefetch={false}>
              Invite writer
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map(({ href, icon: Icon, key, label }) => (
          <Link
            className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={href}
            key={key}
            prefetch={false}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              <Icon aria-hidden="true" className="h-4 w-4 text-editorial" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">
              {stats[key].toLocaleString()}
            </p>
          </Link>
        ))}
      </section>

      <Suspense
        fallback={
          <section className="rounded-2xl border p-5 text-sm text-muted-foreground">
            Loading analytics...
          </section>
        }
      >
        <AnalyticsWidget />
      </Suspense>
    </div>
  )
}
