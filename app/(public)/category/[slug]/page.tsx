import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostList } from "@/components/posts/PostList"
import { prisma } from "@/lib/prisma"
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
  const category = await prisma.category.findUnique({
    select: { description: true, name: true },
    where: { slug },
  })

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
  const category = await prisma.category.findUnique({
    select: { description: true, id: true, name: true, slug: true },
    where: { slug },
  })

  if (!category) {
    notFound()
  }

  const where = {
    category: { slug: category.slug },
    status: "PUBLISHED" as const,
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        _count: { select: { comments: true } },
        author: {
          select: { avatarUrl: true, name: true, username: true },
        },
        category: { select: { id: true, name: true, slug: true } },
        coAuthors: {
          orderBy: { order: "asc" },
          select: {
            user: {
              select: { avatarUrl: true, name: true, username: true },
            },
          },
        },
        coverAlt: true,
        coverUrl: true,
        excerpt: true,
        publishedAt: true,
        slug: true,
        tags: {
          select: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        title: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    prisma.post.count({ where }),
  ])

  return (
    <main className="container max-w-4xl py-8 sm:py-10">
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Category
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
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
    </main>
  )
}
