"use client"

import { Archive, ArchiveRestore, ExternalLink, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface AdminPost {
  _count: { comments: number }
  author: { name: string; username: string }
  id: string
  publishedAt: Date | null
  slug: string
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED"
  title: string
  updatedAt: Date
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

export function AdminPostsTable({ posts }: { posts: AdminPost[] }) {
  const router = useRouter()
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleArchive(post: AdminPost) {
    if (
      !confirm(
        `Archive "${post.title}"? It will be hidden from public view but can be restored later.`,
      )
    ) {
      return
    }

    setArchivingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}/archive`, {
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to archive post")
    } finally {
      setArchivingId(null)
    }
  }

  async function handleUnarchive(post: AdminPost) {
    if (!confirm(`Restore "${post.title}" to draft?`)) return

    setArchivingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}/archive`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to restore post")
    } finally {
      setArchivingId(null)
    }
  }

  async function handleDelete(post: AdminPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return

    setDeletingId(post.id)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post")
    } finally {
      setDeletingId(null)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No posts found for this filter.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-4 py-3 font-medium">Post</th>
            <th className="px-4 py-3 font-medium">Author</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Comments</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              className="border-b transition-colors last:border-0 hover:bg-muted/30"
              key={post.id}
            >
              <td className="max-w-[280px] px-4 py-3">
                <p className="truncate font-medium">{post.title}</p>
                {post.status === "PUBLISHED" && post.publishedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Published {formatDate(post.publishedAt)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  href={`/authors/${post.author.username}`}
                  prefetch={false}
                >
                  {post.author.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={
                    post.status === "ARCHIVED"
                      ? "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
                      : undefined
                  }
                  variant={post.status === "PUBLISHED" ? "default" : "secondary"}
                >
                  {post.status === "PUBLISHED"
                    ? "Published"
                    : post.status === "ARCHIVED"
                      ? "Archived"
                      : "Draft"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {post._count.comments}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(post.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {post.status === "PUBLISHED" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/${post.slug}`} prefetch={false}>
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  )}
                  {post.status === "ARCHIVED" ? (
                    <Button
                      aria-label="Restore post to draft"
                      disabled={archivingId === post.id}
                      onClick={() => void handleUnarchive(post)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
                      Restore
                    </Button>
                  ) : (
                    <Button
                      aria-label="Archive post"
                      disabled={archivingId === post.id}
                      onClick={() => void handleArchive(post)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Archive aria-hidden="true" className="h-4 w-4" />
                      Archive
                    </Button>
                  )}
                  <Button
                    disabled={deletingId === post.id}
                    onClick={() => void handleDelete(post)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
