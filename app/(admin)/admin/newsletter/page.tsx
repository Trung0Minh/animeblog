import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { prisma } from "@/lib/prisma"

export default async function AdminNewsletterPage() {
  const [activeCount, recentPosts] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    prisma.post.findMany({
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true },
      take: 10,
      where: { status: "PUBLISHED" },
    }),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeCount.toLocaleString()} active subscriber
          {activeCount === 1 ? "" : "s"}
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <NewsletterBroadcastForm recentPosts={recentPosts} />
      </section>
    </div>
  )
}
