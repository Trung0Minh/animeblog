"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CommentWithReplies, PublicComment } from "@/types"

interface CommentFormProps {
  ariaLabel?: string
  onCancel?: () => void
  onSuccess: (comment: CommentWithReplies) => void
  parentId?: string
  postId: string
}

interface CommentResponse {
  data?: PublicComment
  error?: string
}

export function CommentForm({
  ariaLabel = "Comment form",
  onCancel,
  onSuccess,
  parentId,
  postId,
}: CommentFormProps) {
  const id = useId()
  const [authorEmail, setAuthorEmail] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifyReply, setNotifyReply] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/comments", {
        body: JSON.stringify({
          authorEmail,
          authorName,
          content,
          notifyReply,
          parentId,
          postId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result = (await response.json()) as CommentResponse

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Could not post comment")
      }

      onSuccess({ ...result.data, replies: [] })
      setAuthorEmail("")
      setAuthorName("")
      setContent("")
      setNotifyReply(true)
      setSuccessMessage(parentId ? "Reply posted." : "Comment posted.")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not post comment",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      aria-label={ariaLabel}
      className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            {successMessage}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              htmlFor={`${id}-comment-name`}
            >
              Name
            </label>
            <Input
              autoComplete="name"
              id={`${id}-comment-name`}
              maxLength={80}
              onChange={(event) => setAuthorName(event.target.value)}
              required
              value={authorName}
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium"
              htmlFor={`${id}-comment-email`}
            >
              Email
            </label>
            <Input
              autoComplete="email"
              id={`${id}-comment-email`}
              inputMode="email"
              onChange={(event) => setAuthorEmail(event.target.value)}
              required
              type="email"
              value={authorEmail}
            />
            <p className="text-xs text-muted-foreground">
              Your email stays private. We only use it for replies.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium"
            htmlFor={`${id}-comment-content`}
          >
            Comment
          </label>
          <Textarea
            id={`${id}-comment-content`}
            maxLength={2000}
            minLength={1}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              parentId
                ? "Add a direct reply to this comment..."
                : "Share a close read, question, or counterpoint..."
            }
            required
            rows={5}
            value={content}
          />
          <p className="text-right text-xs text-muted-foreground">
            {content.length}/2000
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            checked={notifyReply}
            className="mt-1 h-4 w-4 rounded border-input accent-primary"
            onChange={(event) => setNotifyReply(event.target.checked)}
            type="checkbox"
          />
          Notify me by email when someone replies
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting
              ? "Posting..."
              : parentId
                ? "Post reply"
                : "Post comment"}
          </Button>
          {onCancel && (
            <Button
              className="w-full sm:w-auto"
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
