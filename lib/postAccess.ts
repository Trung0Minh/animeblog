import type { DraftVisibility, PostStatus, Role } from "@prisma/client"

interface ViewablePost {
  authorId: string
  coAuthors: { userId: string }[]
  draftVisibility: DraftVisibility
  status: PostStatus
}

export function canViewPost(
  post: ViewablePost,
  userId: string | undefined,
  userRole: Role | undefined,
) {
  if (post.status === "PUBLISHED") return true
  if (post.status === "ARCHIVED") return userRole === "ADMIN"
  if (userRole === "ADMIN") return true
  if (!userId) return false
  if (post.authorId === userId) return true

  if (post.draftVisibility === "CO_AUTHORS") {
    return post.coAuthors.some((coAuthor) => coAuthor.userId === userId)
  }

  return false
}
