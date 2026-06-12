import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"

interface AuthorPageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

function parsePage(page?: string) {
  const parsedPage = Number(page ?? "1")

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { username } = await params
  const author = await prisma.user.findUnique({
    select: { avatarUrl: true, bio: true, name: true },
    where: { username },
  })

  if (!author) {
    return buildMetadata({ canonicalPath: `/authors/${username}`, noIndex: true })
  }

  return buildMetadata({
    canonicalPath: `/authors/${username}`,
    description: author.bio ?? `Posts by ${author.name}`,
    ogImage: author.avatarUrl ?? undefined,
    title: author.name,
  })
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const [{ username }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const page = parsePage(pageParam)
  const author = await prisma.user.findUnique({
    select: {
      avatarUrl: true,
      bio: true,
      createdAt: true,
      id: true,
      name: true,
      username: true,
    },
    where: { username },
  })

  if (!author) {
    notFound()
  }

  const where = {
    OR: [
      { authorId: author.id },
      { coAuthors: { some: { userId: author.id } } },
    ],
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
    <PageContainer>
      <section className="mb-10 flex items-start gap-4 border-b pb-8">
        {author.avatarUrl && (
          <img
            alt={author.name}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            src={author.avatarUrl}
          />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{author.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{author.username}
          </p>
          {author.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed">
              {author.bio}
            </p>
          )}
        </div>
      </section>

      <PostList
        emptyMessage="This author has no published posts yet."
        pagination={{ page, pageSize: PAGE_SIZE, total }}
        posts={posts}
      />
    </PageContainer>
  )
}
