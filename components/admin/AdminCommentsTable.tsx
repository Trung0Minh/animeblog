"use client"

import { Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface AdminComment {
  authorName: string
  content: string
  createdAt: Date
  id: string
  post: { slug: string; title: string }
  status: "APPROVED" | "SPAM"
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

export function AdminCommentsTable({
  comments,
}: {
  comments: AdminComment[]
}) {
  const router = useRouter()
  const [spammingId, setSpammingId] = useState<string | null>(null)

  async function handleMarkSpam(comment: AdminComment) {
    if (!confirm("Mark this comment as spam and hide it?")) return

    setSpammingId(comment.id)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to hide comment")
    } finally {
      setSpammingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No approved comments found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article className="rounded-2xl border bg-card p-4" key={comment.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {comment.authorName}
                </span>
                <span>{formatDate(comment.createdAt)}</span>
                <span>on</span>
                <Link
                  className="max-w-[16rem] truncate text-editorial transition-colors hover:text-foreground hover:underline"
                  href={`/${comment.post.slug}`}
                >
                  {comment.post.title}
                </Link>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {comment.content}
              </p>
            </div>
            <Button
              aria-label="Mark as spam"
              disabled={spammingId === comment.id}
              onClick={() => void handleMarkSpam(comment)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
