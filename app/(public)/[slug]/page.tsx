import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { CommentSection } from "@/components/comments/CommentSection"
import { PostBody } from "@/components/posts/PostBody"
import { PostHeader } from "@/components/posts/PostHeader"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { prisma } from "@/lib/prisma"

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    select: { coverUrl: true, excerpt: true, title: true },
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) {
    return {}
  }

  return {
    description: post.excerpt ?? undefined,
    openGraph: {
      description: post.excerpt ?? undefined,
      images: post.coverUrl ? [post.coverUrl] : [],
      title: post.title,
    },
    title: post.title,
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
      tags: {
        select: {
          tag: { select: { name: true, slug: true } },
        },
      },
      title: true,
    },
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) {
    notFound()
  }

  const content = post.content as JSONContent

  return (
    <article className="container py-8 sm:py-10">
      <PostHeader post={post} />
      <div className="mx-auto mt-8 flex max-w-5xl gap-8">
        <div className="min-w-0 flex-1">
          <PostBody content={content} />
          <CommentSection
            initialComments={post.comments}
            postId={post.id}
          />
        </div>
        <aside className="hidden w-56 shrink-0 xl:block">
          <TableOfContents content={content} />
        </aside>
      </div>
    </article>
  )
}
