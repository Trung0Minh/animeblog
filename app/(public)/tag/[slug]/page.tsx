import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { getCachedTagBySlug, getCachedTagPosts } from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getCachedTagBySlug(slug)

  if (!tag) {
    return buildMetadata({ canonicalPath: `/tag/${slug}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/tag/${slug}`,
    description: `Posts tagged with ${tag.name}`,
    title: `#${tag.name}`,
  })
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const tag = await getCachedTagBySlug(slug)

  if (!tag) {
    notFound()
  }

  const { posts, total } = await getCachedTagPosts(tag.id, page, PAGE_SIZE)

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Tag
        </p>
        <h1 className="text-3xl font-bold tracking-tight">#{tag.name}</h1>
      </section>

      <PostList
        emptyMessage="No published posts with this tag yet."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        posts={posts}
      />
    </PageContainer>
  )
}
