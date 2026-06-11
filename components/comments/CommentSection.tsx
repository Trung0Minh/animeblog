"use client"

import { useState } from "react"

import { CommentForm } from "@/components/comments/CommentForm"
import { CommentList } from "@/components/comments/CommentList"
import type { CommentWithReplies } from "@/types"

interface CommentSectionProps {
  initialComments: CommentWithReplies[]
  postId: string
  postSlug?: string
}

function countComments(comments: CommentWithReplies[]) {
  return comments.reduce(
    (total, comment) => total + 1 + comment.replies.length,
    0,
  )
}

export function CommentSection({
  initialComments,
  postId,
  postSlug,
}: CommentSectionProps) {
  const [comments, setComments] =
    useState<CommentWithReplies[]>(initialComments)
  const total = countComments(comments)

  function handleNewComment(comment: CommentWithReplies) {
    if (comment.parentId) {
      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === comment.parentId
            ? {
                ...currentComment,
                replies: [...currentComment.replies, comment],
              }
            : currentComment,
        ),
      )
      return
    }

    setComments((currentComments) => [...currentComments, comment])
  }

  return (
    <section className="mt-16 border-t pt-10" id="comments">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Reader notes
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {total} comment{total === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Add a close read, correction, or question. Replies stay one level deep
          so the thread remains readable.
        </p>
      </div>

      <CommentForm
        onSuccess={handleNewComment}
        postId={postId}
        postSlug={postSlug}
      />

      {comments.length > 0 && (
        <div className="mt-8">
          <CommentList
            comments={comments}
            onReply={handleNewComment}
            postId={postId}
            postSlug={postSlug}
          />
        </div>
      )}
    </section>
  )
}
