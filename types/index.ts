import type { Comment } from "@prisma/client"

export type PublicComment = Pick<
  Comment,
  | "authorName"
  | "content"
  | "createdAt"
  | "id"
  | "parentId"
  | "postId"
  | "status"
>

export type CommentWithReplies = PublicComment & {
  replies: PublicComment[]
}
