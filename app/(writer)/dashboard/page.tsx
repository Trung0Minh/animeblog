import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      _count: { select: { comments: true } },
      id: true,
      publishedAt: true,
      slug: true,
      status: true,
      title: true,
      updatedAt: true,
    },
    where: { authorId: session.user.id },
  })

  return (
    <main className="container max-w-4xl py-8 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">New post</Link>
        </Button>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <article
            className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
            key={post.id}
          >
            <div className="min-w-0">
              <h2 className="truncate font-medium">{post.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {post.status === "PUBLISHED" && post.publishedAt
                  ? `Published ${formatDate(post.publishedAt)}`
                  : `Draft · Updated ${formatDate(post.updatedAt)}`}
                {" · "}
                {post._count.comments} comment
                {post._count.comments === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                {post.status === "PUBLISHED" ? "Published" : "Draft"}
              </Badge>
              {post.status === "PUBLISHED" && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/${post.slug}`} prefetch={false}>
                    View
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/edit/${post.id}`}>Edit</Link>
              </Button>
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No posts yet.{" "}
            <Link
              className="font-medium text-editorial hover:underline"
              href="/dashboard/new"
            >
              Write your first post.
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
