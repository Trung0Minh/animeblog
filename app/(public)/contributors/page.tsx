import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { getCachedContributors } from "@/lib/queries"
import { buildMetadata, getAppName } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/contributors",
    description: `Meet the writers behind ${getAppName()}.`,
    title: "Contributors",
  })
}

export default async function ContributorsPage() {
  const contributors = await getCachedContributors()

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Contributors
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Writers</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          People invited to write analysis, reviews, and production notes for
          this publication.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {contributors.map((contributor) => (
          <Link
            className="flex gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
            href={`/authors/${contributor.username}`}
            key={contributor.username}
            prefetch={false}
          >
            {contributor.avatarUrl ? (
              <img
                alt={contributor.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
                decoding="async"
                loading="lazy"
                src={contributor.avatarUrl}
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                {contributor.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="block font-semibold">{contributor.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                @{contributor.username} · {contributor._count.posts} post
                {contributor._count.posts === 1 ? "" : "s"}
              </span>
              {contributor.bio && (
                <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">
                  {contributor.bio}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
