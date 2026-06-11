import type { Metadata } from "next"

import { Sidebar } from "@/components/layout/Sidebar"
import { NewsletterForm } from "@/components/newsletter/NewsletterForm"
import { PostList } from "@/components/posts/PostList"
import { prisma } from "@/lib/prisma"
import { buildMetadata, getAppUrl } from "@/lib/seo"

interface HomePageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  return buildMetadata({
    canonicalPath: "/",
    ...(page > 1 && {
      canonicalUrl: `${getAppUrl()}?page=${page}`,
      noIndex: true,
      noIndexFollow: true,
    }),
  })
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  const [posts, total, categories, recentPosts] = await Promise.all([
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
      where: { status: "PUBLISHED" },
    }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        _count: {
          select: { posts: { where: { status: "PUBLISHED" } } },
        },
        children: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        },
        id: true,
        name: true,
        slug: true,
      },
      where: { parentId: null },
    }),
    prisma.post.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: { publishedAt: true, slug: true, title: true },
      take: 5,
      where: { status: "PUBLISHED" },
    }),
  ])

  return (
    <main className="container py-8 sm:py-10">
      <section className="mb-10 max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Latest analysis
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Serious writing about Japanese animation.
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
          In-depth anime analysis, production insight, interviews, and reviews
          in an editorial space designed for comfortable long-form reading.
        </p>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="min-w-0 flex-1" aria-label="Published posts">
          <PostList
            emptyMessage="No posts published yet."
            pagination={{ page, pageSize: PAGE_SIZE, total }}
            posts={posts}
          />
        </section>
        <Sidebar
          categories={categories}
          newsletter={<NewsletterForm />}
          recentPosts={recentPosts}
        />
      </div>
    </main>
  )
}
