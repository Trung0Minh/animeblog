import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import {
  getCachedCategoryBySlug,
  getCachedCategoryPosts,
} from "@/lib/queries"
import { buildMetadata } from "@/lib/seo"

interface CategoryPageProps {
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
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    return buildMetadata({ canonicalPath: `/category/${slug}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/category/${slug}`,
    description:
      category.description ?? `Posts in the ${category.name} category`,
    title: category.name,
  })
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const category = await getCachedCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const { posts, total } = await getCachedCategoryPosts(
    category.id,
    page,
    PAGE_SIZE,
  )

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Category
        </p>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </section>

      <PostList
        emptyMessage="No published posts in this category yet."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        posts={posts}
      />
    </PageContainer>
  )
}
