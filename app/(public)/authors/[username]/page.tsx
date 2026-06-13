import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/layout/PageContainer"
import { PostList } from "@/components/posts/PostList"
import {
  getCachedAuthorByUsername,
  getCachedAuthorPosts,
} from "@/lib/queries"
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
  const author = await getCachedAuthorByUsername(username)

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
  const author = await getCachedAuthorByUsername(username)

  if (!author) {
    notFound()
  }

  const { posts, total } = await getCachedAuthorPosts(
    author.id,
    page,
    PAGE_SIZE,
  )

  return (
    <PageContainer>
      <section className="mb-10 flex items-start gap-4 border-b pb-8">
        {author.avatarUrl && (
          <img
            alt={author.name}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            decoding="async"
            loading="lazy"
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
