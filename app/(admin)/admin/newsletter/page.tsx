import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { getCachedAdminNewsletterData } from "@/lib/queries"

export default async function AdminNewsletterPage() {
  const { activeCount, recentPosts } = await getCachedAdminNewsletterData()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCount.toLocaleString()} active subscriber
          {activeCount === 1 ? "" : "s"}
        </p>
      </div>

      <section className="rounded-[8px] border bg-background p-5">
        <NewsletterBroadcastForm recentPosts={recentPosts} />
      </section>
    </div>
  )
}
