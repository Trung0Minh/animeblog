import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PageContainer } from "@/components/layout/PageContainer"
import { PostBody } from "@/components/posts/PostBody"
import { PostHeader } from "@/components/posts/PostHeader"
import { PostJsonLd } from "@/components/posts/PostJsonLd"
import { PostReadTracker } from "@/components/posts/PostReadTracker"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { prisma } from "@/lib/prisma"
import { buildMetadata } from "@/lib/seo"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    select: {
      author: { select: { name: true } },
      coverUrl: true,
      excerpt: true,
      publishedAt: true,
      tags: { select: { tag: { select: { name: true } } } },
      title: true,
    },
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) {
    return buildMetadata({ canonicalPath: `/${slug}`, noIndex: true })
  }

  const base = buildMetadata({
    canonicalPath: `/${slug}`,
    description: post.excerpt ?? undefined,
    ogImage: post.coverUrl ?? undefined,
    ogType: "article",
    title: post.title,
  })

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      authors: [post.author.name],
      publishedTime: post.publishedAt?.toISOString(),
      tags: post.tags.map(({ tag }) => tag.name),
      type: "article",
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    select: {
      _count: { select: { comments: true } },
      author: {
        select: {
          avatarUrl: true,
          bio: true,
          name: true,
          username: true,
        },
      },
      category: { select: { name: true, slug: true } },
      coAuthors: {
        orderBy: { order: "asc" },
        select: {
          user: {
            select: {
              avatarUrl: true,
              bio: true,
              name: true,
              username: true,
            },
          },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          authorName: true,
          content: true,
          createdAt: true,
          id: true,
          parentId: true,
          postId: true,
          replies: {
            orderBy: { createdAt: "asc" },
            select: {
              authorName: true,
              content: true,
              createdAt: true,
              id: true,
              parentId: true,
              postId: true,
              status: true,
            },
            where: { status: "APPROVED" },
          },
          status: true,
        },
        where: { parentId: null, status: "APPROVED" },
      },
      content: true,
      coverAlt: true,
      coverUrl: true,
      excerpt: true,
      id: true,
      publishedAt: true,
      slug: true,
      tags: {
        select: {
          tag: { select: { name: true, slug: true } },
        },
      },
      title: true,
      updatedAt: true,
    },
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) {
    notFound()
  }

  const content = post.content as JSONContent

  return (
    <>
      <PostJsonLd
        authorName={post.author.name}
        coverUrl={post.coverUrl}
        description={post.excerpt}
        publishedAt={post.publishedAt}
        slug={post.slug}
        title={post.title}
        updatedAt={post.updatedAt}
      />
      <PostReadTracker slug={post.slug} title={post.title} />
      <PageContainer as="article" size="wide">
        <PostHeader post={post} />
        <div className="relative mx-auto mt-8 max-w-6xl xl:max-w-7xl">
          <div className="mx-auto w-full max-w-4xl">
            <PostBody content={content} />
            <CommentSection
              initialComments={post.comments}
              postId={post.id}
              postSlug={post.slug}
            />
          </div>
          <aside className="hidden 2xl:absolute 2xl:left-[calc(50%+30rem)] 2xl:top-0 2xl:block 2xl:w-64">
            <TableOfContents content={content} />
          </aside>
        </div>
      </PageContainer>
    </>
  )
}
