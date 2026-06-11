import { notFound } from "next/navigation"

import { PostList } from "@/components/posts/PostList"
import { prisma } from "@/lib/prisma"

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const tag = await prisma.tag.findUnique({
    select: { id: true, name: true, slug: true },
    where: { slug },
  })

  if (!tag) {
    notFound()
  }

  const where = {
    status: "PUBLISHED" as const,
    tags: { some: { tag: { slug: tag.slug } } },
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
          Tag
        </p>
        <h1 className="text-3xl font-bold tracking-tight">#{tag.name}</h1>
      </section>

      <PostList
        emptyMessage="No published posts with this tag yet."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        posts={posts}
      />
    </main>
  )
}
