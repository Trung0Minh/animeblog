"use client"

import { useState } from "react"
import { Reply } from "lucide-react"

import { CommentForm } from "@/components/comments/CommentForm"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { CommentWithReplies, PublicComment } from "@/types"

interface CommentListProps {
  comments: CommentWithReplies[]
  onReply: (comment: CommentWithReplies) => void
  postId: string
  postSlug?: string
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

function CommentBubble({
  comment,
  isReply = false,
}: {
  comment: PublicComment
  isReply?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
      >
        {getInitial(comment.authorName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold">{comment.authorName}</span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={new Date(comment.createdAt).toISOString()}
          >
            {formatDate(comment.createdAt)}
          </time>
          {isReply && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Reply
            </span>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
          {comment.content}
        </p>
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  onReply,
  postId,
  postSlug,
}: {
  comment: CommentWithReplies
  onReply: (comment: CommentWithReplies) => void
  postId: string
  postSlug?: string
}) {
  const [isReplying, setIsReplying] = useState(false)

  function handleReply(commentReply: CommentWithReplies) {
    onReply(commentReply)
    setIsReplying(false)
  }

  return (
    <article
      className="scroll-mt-24 border-t pt-6 first:border-t-0 first:pt-0"
      id={`comment-${comment.id}`}
    >
      <CommentBubble comment={comment} />
      <div className="mt-3 pl-11">
        <Button
          aria-label={`Reply to ${comment.authorName}'s comment`}
          className="h-auto min-h-0 px-0 py-1 text-xs hover:bg-transparent"
          onClick={() => setIsReplying((value) => !value)}
          type="button"
          variant="ghost"
        >
          <Reply aria-hidden="true" />
          {isReplying ? "Cancel reply" : "Reply"}
        </Button>
      </div>

      {isReplying && (
        <div className="mt-4 border-l pl-4 sm:ml-11">
          <CommentForm
            ariaLabel={`Reply to ${comment.authorName}`}
            onCancel={() => setIsReplying(false)}
            onSuccess={handleReply}
            parentId={comment.id}
            postId={postId}
            postSlug={postSlug}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="mt-5 space-y-4 border-l pl-4 sm:ml-11">
          {comment.replies.map((reply) => (
            <article
              className="scroll-mt-24"
              id={`comment-${reply.id}`}
              key={reply.id}
            >
              <CommentBubble comment={reply} isReply />
            </article>
          ))}
        </div>
      )}
    </article>
  )
}

export function CommentList({
  comments,
  onReply,
  postId,
  postSlug,
}: CommentListProps) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentThread
          comment={comment}
          key={comment.id}
          onReply={onReply}
          postId={postId}
          postSlug={postSlug}
        />
      ))}
    </div>
  )
}
