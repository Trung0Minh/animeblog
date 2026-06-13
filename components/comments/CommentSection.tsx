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
    <section className="mt-12 font-sans" id="comments">
      <div className="mb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-text-primary">
          Comments
        </h2>
        <p className="mt-1 text-[14px] text-text-secondary">
          {total} comment{total === 1 ? "" : "s"}
        </p>
      </div>

      <h3 className="mb-4 text-[14px] font-semibold text-text-primary">
        Leave a comment
      </h3>
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
