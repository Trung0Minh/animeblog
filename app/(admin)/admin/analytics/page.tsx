import { Suspense } from "react"
import { Calendar, Download } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"

export default async function AdminAnalyticsPage() {
  return (
    <div>
      <AdminPageHeader
        action={
          <div className="flex items-center gap-2">
            <button className="flex h-[34px] items-center gap-1.5 rounded-[5px] border border-border-default px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
              Last 30 Days
            </button>
            <button className="flex h-[34px] items-center gap-1.5 rounded-[5px] border border-border-default px-3 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg">
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        }
        subtitle="Detailed traffic and engagement data"
        title="Analytics"
      />

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
