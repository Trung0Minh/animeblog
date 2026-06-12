import { notFound, redirect } from "next/navigation"
import type { JSONContent } from "@tiptap/react"

import { PostEditor } from "@/components/posts/PostEditor"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    select: {
      authorId: true,
      categoryId: true,
      coAuthors: { select: { userId: true } },
      content: true,
      contentText: true,
      coverAlt: true,
      coverUrl: true,
      draftVisibility: true,
      excerpt: true,
      id: true,
      status: true,
      tags: {
        select: {
          tag: { select: { id: true, name: true, slug: true } },
        },
      },
      title: true,
    },
    where: { id },
  })

  if (!post) {
    notFound()
  }

  if (post.status === "ARCHIVED") {
    notFound()
  }

  const canEdit =
    session.user.role === "ADMIN" || session.user.id === post.authorId

  if (!canEdit) {
    notFound()
  }

  const [categories, writers] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
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
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true },
      where: { role: { in: ["ADMIN", "WRITER"] } },
    }),
  ])

  return (
    <PostEditor
      categories={categories}
      currentUserId={session.user.id}
      initialData={{
        categoryId: post.categoryId,
        coAuthorIds: post.coAuthors.map(({ userId }) => userId),
        content: post.content as JSONContent,
        contentText: post.contentText,
        coverAlt: post.coverAlt,
        coverUrl: post.coverUrl,
        draftVisibility: post.draftVisibility,
        excerpt: post.excerpt,
        id: post.id,
        status: post.status,
        tags: post.tags.map(({ tag }) => tag),
        title: post.title,
      }}
      writers={writers}
    />
  )
}
