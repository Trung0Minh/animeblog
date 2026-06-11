import { redirect } from "next/navigation"

import { PostEditor } from "@/components/posts/PostEditor"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function NewPostPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
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
      writers={writers}
    />
  )
}
